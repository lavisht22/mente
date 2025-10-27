export function avatarURL(userId: string) {
    return `https://api.dicebear.com/9.x/glass/svg?seed=${userId}`;
}
