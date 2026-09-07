import { clsx, type ClassValue } from "clsx"
import { twMerge } from "tailwind-merge"
import { NextRequest } from "next/server"

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs))
}

export function getClientIp(req: NextRequest): string {
  const forwarded = req.headers.get("x-forwarded-for")
  if (forwarded) {
    const ip = forwarded.split(",")[0].trim()
    if (ip) return ip
  }
  const realIp = req.headers.get("x-real-ip")
  if (realIp && realIp.trim()) return realIp.trim()
  const clientIp = req.headers.get("x-client-ip")
  if (clientIp && clientIp.trim()) return clientIp.trim()
  return "103.24.188.42" // Default simulated Indian ISP IP
}
