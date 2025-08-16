# Payment Edge Functions Deployment Script for Windows
# This script deploys all payment-related Edge Functions to Supabase

Write-Host "🚀 Deploying Payment Edge Functions to Supabase..." -ForegroundColor Green

# Check if Supabase CLI is installed
try {
    $null = Get-Command supabase -ErrorAction Stop
    Write-Host "✅ Supabase CLI found" -ForegroundColor Green
} catch {
    Write-Host "❌ Supabase CLI is not installed. Please install it first:" -ForegroundColor Red
    Write-Host "   npm install -g supabase" -ForegroundColor Yellow
    Write-Host "   or visit: https://supabase.com/docs/guides/cli" -ForegroundColor Yellow
    exit 1
}

# Check if we're in the right directory
if (-not (Test-Path "supabase/functions")) {
    Write-Host "❌ Please run this script from the project root directory" -ForegroundColor Red
    exit 1
}

# Deploy create-paymob-payment function
Write-Host "📦 Deploying create-paymob-payment function..." -ForegroundColor Blue
supabase functions deploy create-paymob-payment --no-verify-jwt

# Deploy verify-paymob-payment function
Write-Host "📦 Deploying verify-paymob-payment function..." -ForegroundColor Blue
supabase functions deploy verify-paymob-payment --no-verify-jwt

# Deploy check-payment-status function
Write-Host "📦 Deploying check-payment-status function..." -ForegroundColor Blue
supabase functions deploy check-payment-status --no-verify-jwt

Write-Host "✅ All payment functions deployed successfully!" -ForegroundColor Green
Write-Host ""
Write-Host "🔧 Next steps:" -ForegroundColor Yellow
Write-Host "1. Go to Supabase Dashboard → Settings → Edge Functions" -ForegroundColor White
Write-Host "2. Set these environment variables:" -ForegroundColor White
Write-Host "   - PAYMOB_HMAC_SECRET: your_hmac_secret_here" -ForegroundColor White
Write-Host "3. Test the payment flow with a sandbox course" -ForegroundColor White
Write-Host ""
Write-Host "🌐 Your functions are now available at:" -ForegroundColor Yellow
Write-Host "   - /functions/v1/create-paymob-payment" -ForegroundColor White
Write-Host "   - /functions/v1/verify-paymob-payment" -ForegroundColor White
Write-Host "   - /functions/v1/check-payment-status" -ForegroundColor White
