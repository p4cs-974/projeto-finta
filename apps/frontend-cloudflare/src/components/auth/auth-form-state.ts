export interface LoginFormState {
  formError: string | null;
  fieldErrors: Partial<Record<"email" | "password", string[]>>;
}

export interface SignupFormState {
  formError: string | null;
  fieldErrors: Partial<
    Record<"name" | "email" | "password" | "confirmPassword", string[]>
  >;
}

export const initialLoginFormState: LoginFormState = {
  formError: null,
  fieldErrors: {},
};

export const initialSignupFormState: SignupFormState = {
  formError: null,
  fieldErrors: {},
};
