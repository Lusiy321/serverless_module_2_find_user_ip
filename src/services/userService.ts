import bcrypt from "bcrypt";
import { createClient } from "@supabase/supabase-js";
import { v4 as uuidv4 } from "uuid";
require("dotenv").config();

const supabaseUrl = `${process.env.DATABASE_URL}`;
const supabaseKey = `${process.env.SUPABASE_KEY}`;

class User {
  constructor(public email: string, public password: string) {}
}

export const supabase = createClient(supabaseUrl, supabaseKey);

export class UserService {
  static async registerUser(
    email: string,
    password: string,
    accessToken: string,
    refreshToken: string
  ): Promise<any> {
    try {
      const id = uuidv4();
      const { error } = await supabase.from("users").insert({
        id,
        email,
        password,
        accessToken,
        refreshToken,
      });
      if (error) {
        return { error: error.message };
      }
      if (!error) {
        const { data, error } = await supabase
          .from("users")
          .select()
          .eq("email", email);
        if (error) {
          return { error: error.message };
        }
        return data;
      }
    } catch (error) {
      return { error: "Database error" };
    }
  }

  static async findUserByEmail(email: string): Promise<any> {
    try {
      const { data, error } = await supabase
        .from("users")
        .select()
        .eq("email", email);

      if (error) {
        return { error: error.message };
      }
      return data;
    } catch (error) {
      return { error: "User not found" };
    }
  }
  static async comparePasswords(
    password: string,
    hashedPassword: string
  ): Promise<boolean> {
    return await bcrypt.compare(password, hashedPassword);
  }
}
