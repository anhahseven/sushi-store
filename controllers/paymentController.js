import crypto from "crypto";

// Private helper function to generate the ABA Hash and Payload
const generateAbaPayload = (transactionId, amount, paymentOption = "abapay_khqr") => {
  const merchantId = process.env.ABA_MERCHANT_ID;
  const apiKey = process.env.ABA_API_KEY;
  const baseUrl = process.env.BASE_URL || 'http://localhost:3000';
  
  // PayWay requires reqTime to be a string
  const reqTime = Math.floor(Date.now() / 1000).toString(); 

  const items = "";
  const shipping = "";
  const cfirstname = "Murakami";
  const clastname = "Customer";
  const cemail = "customer@example.com";
  const cphone = "099999999";
  const type = "purchase";
  const payment_option = paymentOption;
  const return_url = `${baseUrl}/orders`;
  const cancel_url = "";
  const continue_success_url = "";
  const return_deeplink = "";
  const currency = "";
  const custom_fields = "";
  const return_params = "";
  const payout = "";
  const lifetime = "";
  const additional_params = "";
  const google_pay_token = "";
  const skip_success_page = "";

  // Concatenate exactly in this order for ABA PayWay
  const dataToHash = reqTime + merchantId + transactionId + amount + items + shipping + cfirstname + clastname + cemail + cphone + type + payment_option + return_url + cancel_url + continue_success_url + return_deeplink + currency + custom_fields + return_params + payout + lifetime + additional_params + google_pay_token + skip_success_page;

  const hash = crypto
    .createHmac("sha512", apiKey)
    .update(dataToHash)
    .digest("base64");

  return {
    hash,
    reqTime,
    merchantId,
    items,
    shipping,
    cfirstname,
    clastname,
    cemail,
    cphone,
    type,
    payment_option,
    return_url,
    cancel_url,
    continue_success_url,
    return_deeplink,
    currency,
    custom_fields,
    return_params,
    payout,
    lifetime,
    additional_params,
    google_pay_token,
    skip_success_page,
  };
};

// GET: Render the payment confirmation page
export const renderPaymentPage = async (req, res) => {
  try {
    const orderId = req.params.id;
    const pool = req.pool; // Access the DB pool passed from your index.js middleware

    const orderRes = await pool.query("SELECT * FROM orders WHERE id = $1", [orderId]);
    if (orderRes.rows.length === 0) return res.redirect("/");

    const order = orderRes.rows[0];
    const amount = parseFloat(order.total_price).toFixed(2); // Must be 2 decimal places

    // Generate the required hash and form payload
    const abaPayload = generateAbaPayload(orderId, amount, "abapay_khqr");

    res.render("website/payment", {
      title: "Confirm Payment",
      layout: "layouts",
      orderId: orderId,
      amount: amount,
      abaPayload: abaPayload,
      abaUrl: process.env.ABA_API_URL
    });
  } catch (err) {
    console.error("Payment Error:", err);
    res.redirect("/profile");
  }
};

// POST: Confirm the payment and update status
import { createAbaPayment } from "../services/abaPayment.js";

export const confirmPayment = async (req, res) => {
  try {
    const orderId = req.params.id;
    const pool = req.pool;
    
    await pool.query("UPDATE orders SET status = 'Processing' WHERE id = $1", [orderId]);
    // Create the ABA payment using the same orderId and amount
    try {
      const amountResult = await pool.query("SELECT total_price FROM orders WHERE id = $1", [orderId]);
      const amount = parseFloat(amountResult.rows[0].total_price).toFixed(2);
      const abaResponse = await createAbaPayment(orderId, amount);
      console.log('ABA payment created:', abaResponse);
      // Optionally store the transaction ID returned by PayWay (field may be tran_id or pw_tran_id)
      const tranId = abaResponse.tran_id || abaResponse.pw_tran_id;
      if (tranId) {
        await pool.query("UPDATE orders SET aba_tran_id = $1 WHERE id = $2", [tranId, orderId]);
      }
    } catch (payErr) {
      console.error('ABA payment error:', payErr);
      // Keep order in processing state; you could decide to rollback if necessary
    }
    res.redirect("/orders");
  } catch (err) {
    console.error(err);
    res.status(500).send("Error confirming payment");
  }
};