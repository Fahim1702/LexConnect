export function publicUser(user) {
  return {
    id: user._id,
    firebaseUid: user.firebaseUid,
    name: user.name,
    email: user.email,
    phone: user.phone,
    role: user.role,
    isActive: user.isActive,
    createdAt: user.createdAt
  };
}
