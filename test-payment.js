// Payment System Test Script
// Run this in your browser console to test the payment flow

console.log('🧪 Testing Payment System...');

// Test 1: Check if Supabase client is available
if (typeof supabase !== 'undefined') {
  console.log('✅ Supabase client is available');
} else {
  console.log('❌ Supabase client not found');
}

// Test 2: Check if user is authenticated
async function testAuthentication() {
  try {
    const { data: { user }, error } = await supabase.auth.getUser();
    if (user) {
      console.log('✅ User is authenticated:', user.email);
      return user;
    } else {
      console.log('❌ User not authenticated');
      return null;
    }
  } catch (error) {
    console.log('❌ Authentication test failed:', error.message);
    return null;
  }
}

// Test 3: Test Edge Function availability
async function testEdgeFunctions() {
  const functions = [
    'create-paymob-payment',
    'verify-paymob-payment', 
    'check-payment-status'
  ];
  
  for (const funcName of functions) {
    try {
      const response = await fetch(`/functions/v1/${funcName}`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({ test: true })
      });
      
      if (response.status === 401) {
        console.log(`✅ ${funcName}: Function accessible (auth required)`);
      } else if (response.status === 200) {
        console.log(`✅ ${funcName}: Function working`);
      } else {
        console.log(`⚠️ ${funcName}: Status ${response.status}`);
      }
    } catch (error) {
      console.log(`❌ ${funcName}: ${error.message}`);
    }
  }
}

// Test 4: Test course data
async function testCourseData() {
  try {
    const { data: courses, error } = await supabase
      .from('courses')
      .select('id, title_en, price, is_published')
      .eq('is_published', true)
      .limit(5);
    
    if (error) throw error;
    
    if (courses && courses.length > 0) {
      console.log('✅ Courses found:', courses.length);
      console.log('📚 Sample course:', courses[0]);
      return courses[0];
    } else {
      console.log('⚠️ No published courses found');
      return null;
    }
  } catch (error) {
    console.log('❌ Course data test failed:', error.message);
    return null;
  }
}

// Test 5: Test payment creation (requires authentication)
async function testPaymentCreation(courseId) {
  if (!courseId) {
    console.log('⚠️ Skipping payment test - no course available');
    return;
  }
  
  try {
    const { data, error } = await supabase.functions.invoke('create-paymob-payment', {
      body: {
        courseId: courseId,
        paymentMethod: 'card'
      }
    });
    
    if (error) throw error;
    
    if (data.success) {
      console.log('✅ Payment creation successful:', data);
      return data;
    } else {
      console.log('❌ Payment creation failed:', data.error);
      return null;
    }
  } catch (error) {
    console.log('❌ Payment creation test failed:', error.message);
    return null;
  }
}

// Run all tests
async function runAllTests() {
  console.log('\n🚀 Starting Payment System Tests...\n');
  
  // Test 1: Authentication
  const user = await testAuthentication();
  
  // Test 2: Edge Functions
  await testEdgeFunctions();
  
  // Test 3: Course Data
  const course = await testCourseData();
  
  // Test 4: Payment Creation (if authenticated and course available)
  if (user && course) {
    await testPaymentCreation(course.id);
  }
  
  console.log('\n🎯 Test Summary:');
  console.log('- Check the results above for ✅ success, ❌ errors, or ⚠️ warnings');
  console.log('- If you see errors, check the setup guide: PAYMENT_SETUP_GUIDE.md');
  console.log('- Make sure Edge Functions are deployed before testing payments');
}

// Run tests when script is loaded
runAllTests();

// Export functions for manual testing
window.testPaymentSystem = {
  testAuth: testAuthentication,
  testFunctions: testEdgeFunctions,
  testCourses: testCourseData,
  testPayment: testPaymentCreation,
  runAll: runAllTests
};

console.log('\n💡 Manual testing available:');
console.log('- testPaymentSystem.testAuth()');
console.log('- testPaymentSystem.testFunctions()');
console.log('- testPaymentSystem.testCourses()');
console.log('- testPaymentSystem.testPayment(courseId)');
console.log('- testPaymentSystem.runAll()');

