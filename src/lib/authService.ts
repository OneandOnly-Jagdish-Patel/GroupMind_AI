export const signupUser = (name: string, email: string, password: string) => {
  const users = JSON.parse(localStorage.getItem("users") || "[]");

  if (users.some((u: any) => u.email === email)) {
    throw new Error("User already exists");
  }

  const newUser = { name, email, password };
  users.push(newUser);

  localStorage.setItem("users", JSON.stringify(users));
  localStorage.setItem("currentUser", JSON.stringify(newUser));
};

export const loginUser = (email: string, password: string) => {
  const users = JSON.parse(localStorage.getItem("users") || "[]");

  const user = users.find((u: any) => u.email === email && u.password === password);
  if (!user) throw new Error("Invalid email or password");

  localStorage.setItem("currentUser", JSON.stringify(user));
};

export const getCurrentUser = () => {
  return JSON.parse(localStorage.getItem("currentUser") || "null");
};

export const logoutUser = () => {
  localStorage.removeItem("currentUser");
};
