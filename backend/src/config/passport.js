import passport from "passport";
import { Strategy as GoogleStrategy } from "passport-google-oauth20";
import prisma from "../db/prisma.js";

export const parseCollegeEmail = (email) => {
  const domain = "nith.ac.in";

  if (!email.endsWith(`@${domain}`)) {
    const err = new Error("invalid_college_email");
    err.type = "invalid_college_email";
    throw err;
  }

  const rollNumber = email.split("@")[0];

  if (!/^[0-9]{2}[a-z]{3}[0-9]{3}$/i.test(rollNumber)) {
    const err = new Error("invalid_roll_format");
    err.type = "invalid_roll_format";
    throw err;
  }

  return rollNumber.toLowerCase();
};

passport.serializeUser((user, done) => {
  done(null, user.id);
});

passport.deserializeUser(async (id, done) => {
  try {
    const user = await prisma.user.findUnique({ where: { id: id } });
    done(null, user);
  } catch (err) {
    done(err, null);
  }
});

passport.use(
  new GoogleStrategy(
    {
      clientID: process.env.GOOGLE_CLIENT_ID,
      clientSecret: process.env.GOOGLE_CLIENT_SECRET,
      callbackURL: `${process.env.BACKEND_URL}/api/auth/google/callback`,
    },
    async (accessToken, refreshToken, profile, done) => {
      try {
        const email = profile.emails?.[0]?.value;

        if (!email) {
          return done(null, false, { message: "no_google_email" });
        }

        let rollNumber;
        try {
          rollNumber = parseCollegeEmail(email);
        } catch (err) {
          return done(null, false, { message: err.type || "auth_failed" });
        }

        // find or create user
        let user = await prisma.user.findUnique({
          where: { email },
        });

        if (!user) {
          user = await prisma.user.create({
            data: {
              email,
              rollNumber,
              verified: true,
              onboardingCompleted: false,
            },
          });
        }

        return done(null, user);
      } catch (err) {
        return done(null, false, { message: "auth_failed" });
      }
    },
  ),
);

export default passport;
