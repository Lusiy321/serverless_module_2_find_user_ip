import jwt, { JwtPayload } from "jsonwebtoken";
import { UserService, supabase } from "../services/userService";
import { SECRET_KEY, TOKEN_TTL } from "../controllers/authController";

export async function userAuth(req: any, res: any, next: any) {
  const { authorization = "" } = req.headers;
  const [bearer, token] = authorization.split(" ");

  if (bearer !== "Bearer") {
    return res
      .status(401)
      .json({ success: false, error: "Authentication failed" });
  }

  try {
    const checkToken = jwt.verify(token, SECRET_KEY) as JwtPayload;
    const user = await UserService.findUserByEmail(checkToken.email);

    if (Array.isArray(user) && user.length === 0) {
      return res.status(404).json({ success: false, error: "User not found" });
    }

    if (!user[0].accessToken) {
      return res
        .status(401)
        .json({ success: false, error: "Authentication failed" });
    }

    req.user = user[0].refreshToken;
  } catch (error) {
    if (error instanceof jwt.TokenExpiredError) {
      try {
        const { data, error } = await supabase
          .from("users")
          .select()
          .eq("accessToken", token);

        if (error) {
          return res.status(500).json({ success: false, error: error.message });
        }

        if (data) {
          const email = data[0].email;
          const accessToken = jwt.sign({ email }, SECRET_KEY, {
            expiresIn: TOKEN_TTL,
          });

          const { error } = await supabase
            .from("users")
            .update({ accessToken: accessToken })
            .eq("id", data[0].id);

          if (error) {
            return res
              .status(500)
              .json({ success: false, error: error.message });
          }
          next((req.user = data[0].refreshToken));
        }
      } catch (error) {
        return res
          .status(500)
          .json({ success: false, error: "Authentication failed" });
      }
    } else {
      return res
        .status(401)
        .json({ success: false, error: "Authentication failed" });
    }
  }

  next();
}
