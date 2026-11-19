require('dotenv').config();

async function testStep2(customCode) {
  const code = customCode || process.argv[2];
  if (!code) {
    console.error("❌ กรุณาระบุ code เช่น: node test-step2.js <YOUR_CODE>");
    process.exit(1);
  }

  const mophIdUrl = (process.env.MOPH_ID_API_URL || "https://uat-moph.id.th").replace(/\/+$/, "");
  const clientId = process.env.CLIENT_ID;
  const clientSecret = process.env.CLIENT_SECRET;
  const redirectUri = process.env.MOPH_REDIRECT_URI || "http://127.0.0.1:8081";

  console.log("==========================================");
  console.log("ทดสอบขั้นตอนที่ 2: แลก ACCESS_TOKEN_MOPH");
  console.log("==========================================");
  console.log("MOPH URL     :", `${mophIdUrl}/api/v1/token`);
  console.log("CLIENT_ID    :", clientId ? `${clientId.substring(0, 5)}...` : "(ยังไม่ได้ตั้งใน .env)");
  console.log("REDIRECT_URI :", redirectUri);
  console.log("CODE         :", `${code.substring(0, 20)}... (ความยาว ${code.length} ตัวอักษร)`);
  console.log("------------------------------------------");

  if (!clientId || !clientSecret) {
    console.error("⚠️  กรุณากรอก CLIENT_ID และ CLIENT_SECRET ในไฟล์ .env ก่อนทดสอบครับ");
    process.exit(1);
  }

  try {
    const payload = {
      grant_type: "authorization_code",
      code: code.trim(),
      redirect_uri: redirectUri,
      client_id: clientId,
      client_secret: clientSecret,
    };

    const res = await fetch(`${mophIdUrl}/api/v1/token`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(payload),
    });

    const data = await res.json().catch(() => ({}));
    console.log("Response Status:", res.status);
    console.log("Response Body  :", JSON.stringify(data, null, 2));

    if (res.ok && data.status === "success") {
      console.log("\n🎉 สำเร็จ! ได้รับ ACCESS_TOKEN_MOPH:");
      console.log(data.data.access_token);
    } else {
      console.log("\n❌ ไม่สำเร็จ:", data.message || res.statusText);
    }
  } catch (err) {
    console.error("Error:", err.message);
  }
}

testStep2();
