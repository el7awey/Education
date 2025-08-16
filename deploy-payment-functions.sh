#!/bin/bash

# Payment Edge Functions Deployment Script
# This script deploys all payment-related Edge Functions to Supabase

echo "🚀 Deploying Payment Edge Functions to Supabase..."

# Check if Supabase CLI is installed
if ! command -v supabase &> /dev/null; then
    echo "❌ Supabase CLI is not installed. Please install it first:"
    echo "   npm install -g supabase"
    echo "   or visit: https://supabase.com/docs/guides/cli"
    exit 1
fi

# Check if we're in the right directory
if [ ! -d "supabase/functions" ]; then
    echo "❌ Please run this script from the project root directory"
    exit 1
fi

# Deploy create-paymob-payment function
echo "📦 Deploying create-paymob-payment function..."
supabase functions deploy create-paymob-payment --no-verify-jwt

# Deploy verify-paymob-payment function
echo "📦 Deploying verify-paymob-payment function..."
supabase functions deploy verify-paymob-payment --no-verify-jwt

# Deploy check-payment-status function
echo "📦 Deploying check-payment-status function..."
supabase functions deploy check-payment-status --no-verify-jwt

echo "✅ All payment functions deployed successfully!"
echo ""
echo "🔧 Next steps:"
echo "1. Go to Supabase Dashboard → Settings → Edge Functions"
echo "2. Set these environment variables:"
echo "   - PAYMOB_HMAC_SECRET: your_hmac_secret_here"
echo "3. Test the payment flow with a sandbox course"
echo ""
echo "🌐 Your functions are now available at:"
echo "   - /functions/v1/create-paymob-payment"
echo "   - /functions/v1/verify-paymob-payment"
echo "   - /functions/v1/check-payment-status"
