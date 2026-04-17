let generatedOTP;

function sendOTP(){
generatedOTP = Math.floor(100000 + Math.random()*900000);
alert("Demo OTP: " + generatedOTP);
}

function calculatePrice(){
const plan=document.getElementById('plan').value;
const duration=document.getElementById('duration').value;
const base={basic:1000,standard:1500,premium:2000};
if(plan&&duration)
document.getElementById('price').innerText="Total Amount: ₹"+base[plan]*duration;
}

document.getElementById("membershipForm").addEventListener("submit",function(e){
e.preventDefault();
const otp=document.getElementById("otp").value;
if(otp!=generatedOTP){alert("Invalid OTP");return;}
alert("Payment Successful (Demo)");
window.location.href="admin.html";
});
