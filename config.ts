
// Supabase configuration
export const SUPABASE_URL = "https://pzbhluqbhpwcocqfmrcp.supabase.co";
export const SUPABASE_ANON_KEY = "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InB6YmhsdXFiaHB3Y29jcWZtcmNwIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NjQ2NjUxNzgsImV4cCI6MjA4MDI0MTE3OH0.vswx9pFnia38Zp0_6CBVtTpecV1d6ZdkWk_MgLnQrnA";

// ------------------------------------------------------------------
// 🔒 PRIVACY CONFIGURATION (隐私配置)
// ⚠️ WARNING: DO NOT MODIFY THIS FILE WITHOUT PERMISSION
// ⚠️ 警告：未经允许，严禁擅自修改本文件
// ------------------------------------------------------------------

// Configure your Gemini API Key here.
// 在此处配置您的 Gemini API Key。
// You can replace process.env.API_KEY with your actual key string, e.g., "AIzaSy..."
// 您可以将 process.env.API_KEY 替换为您的真实 Key 字符串，例如 "AIzaSy..."
export const GEMINI_API_KEY = process.env.API_KEY || "";
