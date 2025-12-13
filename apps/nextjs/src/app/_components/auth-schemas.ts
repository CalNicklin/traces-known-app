import { formOptions } from "@tanstack/react-form-nextjs";

export {
  confirmPasswordSchema,
  emailSchema,
  nameSchema,
  passwordSchema,
  signInPasswordSchema,
  signInSchema,
  signUpSchema,
  usernameSchema,
} from "@acme/auth/validation";
export type { SignInFormValues, SignUpFormValues } from "@acme/auth/validation";

// Sign In Form Options
export const signInFormOpts = formOptions({
  defaultValues: {
    email: "",
    password: "",
  },
});

// Sign Up Form Options (default values for form fields)
export const signUpFormOpts = formOptions({
  defaultValues: {
    name: "",
    username: "",
    email: "",
    password: "",
    confirmPassword: "",
  },
});
