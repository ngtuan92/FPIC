export function hasPermission(user, permission) {


  return user?.permissions?.includes(permission);
}
