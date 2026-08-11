const { sendMail, smtpConfigured } = require('./mailService');

function formatInr(amount) {
  const value = Number(amount) || 0;
  return `₹${value.toLocaleString('en-IN', { maximumFractionDigits: 2 })}`;
}

function escapeHtml(value) {
  return String(value ?? '')
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;');
}

function formatAddressLines(shippingAddress = {}) {
  return [
    shippingAddress.fullName,
    shippingAddress.mobile ? `Mobile: ${shippingAddress.mobile}` : '',
    shippingAddress.addressLine1,
    shippingAddress.addressLine2,
    shippingAddress.landmark,
    [shippingAddress.city, shippingAddress.state, shippingAddress.pincode].filter(Boolean).join(', '),
    shippingAddress.country,
  ].filter(Boolean);
}

function buildOrderItemsHtml(items = []) {
  if (!items.length) return '<p>No items listed.</p>';

  const rows = items
    .map((item) => {
      const qty = Number(item.quantity) || 1;
      const lineTotal = Number(item.lineFinalTotal ?? item.price * qty) || 0;
      return `
        <tr>
          <td style="padding:8px 0;border-bottom:1px solid #eee;">${escapeHtml(item.name)}</td>
          <td style="padding:8px 0;border-bottom:1px solid #eee;text-align:center;">${qty}</td>
          <td style="padding:8px 0;border-bottom:1px solid #eee;text-align:right;">${formatInr(lineTotal)}</td>
        </tr>
      `;
    })
    .join('');

  return `
    <table style="width:100%;border-collapse:collapse;font-size:14px;">
      <thead>
        <tr>
          <th style="text-align:left;padding:8px 0;border-bottom:2px solid #ddd;">Item</th>
          <th style="text-align:center;padding:8px 0;border-bottom:2px solid #ddd;">Qty</th>
          <th style="text-align:right;padding:8px 0;border-bottom:2px solid #ddd;">Amount</th>
        </tr>
      </thead>
      <tbody>${rows}</tbody>
    </table>
  `.trim();
}

function buildOrderSummaryBlock(order = {}) {
  const snapshot = order.appliedDiscountSnapshot || {};
  const subtotal = Number(snapshot.subtotal ?? order.totalAmount) || 0;
  const discountTotal = Number(snapshot.discountTotal) || 0;
  const finalTotal = Number(snapshot.finalTotal ?? order.totalAmount) || 0;
  const couponCode = String(snapshot.couponCode || '').trim();

  return `
    <div style="margin-top:16px;padding-top:12px;border-top:1px solid #eee;font-size:14px;">
      <p style="margin:4px 0;">Subtotal: ${formatInr(subtotal)}</p>
      ${discountTotal > 0 ? `<p style="margin:4px 0;color:#059669;">Discount: −${formatInr(discountTotal)}${couponCode ? ` (${escapeHtml(couponCode)})` : ''}</p>` : ''}
      <p style="margin:8px 0 0;font-size:16px;font-weight:700;">Total paid: ${formatInr(finalTotal)}</p>
    </div>
  `.trim();
}

function orderConfirmationHtml({ name, order }) {
  const orderNumber = order.orderId || String(order._id || '');
  const addressLines = formatAddressLines(order.shippingAddress)
    .map((line) => `<div>${escapeHtml(line)}</div>`)
    .join('');

  return `
    <div style="font-family:Arial,sans-serif;line-height:1.6;color:#111;max-width:620px;margin:0 auto;padding:24px;">
      <h2 style="margin:0 0 8px;">Order confirmed</h2>
      <p style="margin:0 0 16px;color:#555;">Thank you for shopping with Your Elegance Store.</p>
      <p>Hi ${escapeHtml(name || 'there')},</p>
      <p>Your payment was received and order <strong>#${escapeHtml(orderNumber)}</strong> is confirmed.</p>
      ${buildOrderItemsHtml(order.items)}
      ${buildOrderSummaryBlock(order)}
      <div style="margin-top:20px;padding:14px;background:#f8fafc;border-radius:8px;">
        <p style="margin:0 0 8px;font-weight:600;">Shipping to</p>
        ${addressLines}
      </div>
      <p style="margin-top:20px;font-size:13px;color:#555;">We will notify you when your order ships.</p>
      <hr style="border:none;border-top:1px solid #eee;margin:24px 0;" />
      <p style="font-size:12px;color:#666;">Your Elegance Store · info@yourelegancestore.com</p>
    </div>
  `.trim();
}

function orderConfirmationText({ name, order }) {
  const orderNumber = order.orderId || String(order._id || '');
  const lines = (order.items || []).map((item) => {
    const qty = Number(item.quantity) || 1;
    const lineTotal = Number(item.lineFinalTotal ?? item.price * qty) || 0;
    return `- ${item.name} × ${qty} = ${formatInr(lineTotal)}`;
  });

  const addressLines = formatAddressLines(order.shippingAddress);

  return [
    `Hi ${name || 'there'},`,
    '',
    `Your order #${orderNumber} is confirmed.`,
    '',
    'Items:',
    ...lines,
    '',
    `Total paid: ${formatInr(order.appliedDiscountSnapshot?.finalTotal ?? order.totalAmount)}`,
    '',
    'Shipping to:',
    ...addressLines,
    '',
    'Thank you for shopping with Your Elegance Store.',
  ].join('\n');
}

function adminNewOrderHtml({ order }) {
  const orderNumber = order.orderId || String(order._id || '');
  const customerName = order.shippingAddress?.fullName || order.user?.name || 'Customer';
  const customerEmail = order.user?.email || order.shippingAddress?.email || '—';
  const customerMobile = order.shippingAddress?.mobile || order.user?.mobile || '—';

  return `
    <div style="font-family:Arial,sans-serif;line-height:1.6;color:#111;max-width:620px;margin:0 auto;padding:24px;">
      <h2 style="margin:0 0 16px;">New paid order</h2>
      <p><strong>Order:</strong> #${escapeHtml(orderNumber)}</p>
      <p><strong>Customer:</strong> ${escapeHtml(customerName)}</p>
      <p><strong>Email:</strong> ${escapeHtml(customerEmail)}</p>
      <p><strong>Mobile:</strong> ${escapeHtml(customerMobile)}</p>
      ${buildOrderItemsHtml(order.items)}
      ${buildOrderSummaryBlock(order)}
    </div>
  `.trim();
}

function getAdminMailRecipients() {
  const raw = String(process.env.MAIL_ADMIN || process.env.MAIL_FROM || '').trim();
  if (!raw) return [];
  return raw
    .split(',')
    .map((entry) => entry.trim())
    .filter(Boolean);
}

async function sendOrderConfirmationEmail(order, { customerEmail, customerName } = {}) {
  const to = String(customerEmail || order?.user?.email || order?.shippingAddress?.email || '').trim();
  if (!to) {
    return { ok: false, skipped: true, reason: 'no_customer_email' };
  }

  const name = customerName || order?.shippingAddress?.fullName || order?.user?.name || '';
  const orderNumber = order.orderId || String(order._id || '');

  return sendMail({
    to,
    subject: `Order confirmed #${orderNumber} | Your Elegance Store`,
    text: orderConfirmationText({ name, order }),
    html: orderConfirmationHtml({ name, order }),
  });
}

async function sendAdminNewOrderEmail(order) {
  const recipients = getAdminMailRecipients();
  if (!recipients.length) {
    return { ok: false, skipped: true, reason: 'no_admin_recipients' };
  }

  const orderNumber = order.orderId || String(order._id || '');

  return sendMail({
    to: recipients.join(', '),
    subject: `New order #${orderNumber} | Your Elegance Store`,
    text: `New paid order #${orderNumber}. Total: ${formatInr(order.appliedDiscountSnapshot?.finalTotal ?? order.totalAmount)}`,
    html: adminNewOrderHtml({ order }),
  });
}

async function sendWelcomeEmail({ to, name }) {
  const safeName = name ? String(name).trim() : 'there';
  const subject = 'Welcome to Your Elegance Store';
  const text = [
    `Hi ${safeName},`,
    '',
    'Welcome to Your Elegance Store!',
    'Your account is ready — browse our collection and enjoy exclusive offers.',
    '',
    'Happy shopping!',
    'Your Elegance Store',
  ].join('\n');

  const html = `
    <div style="font-family:Arial,sans-serif;line-height:1.6;color:#111;max-width:560px;margin:0 auto;padding:24px;">
      <h2 style="margin:0 0 16px;">Welcome!</h2>
      <p>Hi ${escapeHtml(safeName)},</p>
      <p>Thank you for creating an account at <strong>Your Elegance Store</strong>.</p>
      <p>You're all set to shop elegant jewellery, bags, and curated fashion.</p>
      <hr style="border:none;border-top:1px solid #eee;margin:24px 0;" />
      <p style="font-size:12px;color:#666;">Your Elegance Store · info@yourelegancestore.com</p>
    </div>
  `.trim();

  return sendMail({ to, subject, text, html });
}

function queueOrderPaidEmails(orderDoc) {
  if (!smtpConfigured() || !orderDoc) return;

  const order =
    typeof orderDoc.toObject === 'function' ? orderDoc.toObject({ virtuals: true }) : orderDoc;

  Promise.allSettled([sendOrderConfirmationEmail(order), sendAdminNewOrderEmail(order)]).then(
    (results) => {
      results.forEach((result, index) => {
        if (result.status === 'rejected') {
          const label = index === 0 ? 'customer confirmation' : 'admin notification';
          console.error(`[mail] Order email failed (${label}):`, result.reason?.message || result.reason);
        }
      });
    }
  );
}

module.exports = {
  sendOrderConfirmationEmail,
  sendAdminNewOrderEmail,
  sendWelcomeEmail,
  queueOrderPaidEmails,
};
