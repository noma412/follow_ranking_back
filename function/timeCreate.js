export const timeCreate = (created_at) => {
  const timestanp = new Date(created_at)
  const month = timestanp.getMonth() + 1
  const day = timestanp.getDate()
  const hours =
    timestanp.getHours() < 10
      ? '0' + timestanp.getHours()
      : timestanp.getHours()
  const minutes =
    timestanp.getMinutes() < 10
      ? '0' + timestanp.getMinutes()
      : timestanp.getMinutes()
  return `${month}月${day}日 ${hours}:${minutes}`
}
