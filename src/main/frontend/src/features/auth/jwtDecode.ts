interface JwtPayload {
  loginIdx: number;
  nickname: string;
  email?: string;
  profileImage?: string;
  role?: string;
  iat?: number;
  exp?: number;
}

function base64UrlDecode(str: string): JwtPayload | null {
  try {
    // Base64 URL -> Base64 변환
    str = str.replace(/-/g, "+").replace(/_/g, "/");
    // Base64 디코딩
    const decodedStr = atob(str);
    // UTF-8 디코딩
    const bytes = new Uint8Array(
      decodedStr.split("").map((char) => char.charCodeAt(0))
    );
    const decodedText = new TextDecoder("utf-8").decode(bytes);
    return JSON.parse(decodedText);
  } catch (e) {
    console.error("Failed to decode base64 string:", e);
    return null;
  }
}

// VueJwtDecode.decode() 대신에 custom decode 사용
export default function customJwtDecode(token: string): JwtPayload | null {
  const base64Url = token.split(".")[1];
  return base64UrlDecode(base64Url);
}
