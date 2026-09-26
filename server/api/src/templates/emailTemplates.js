/**
 * Bộ mẫu Email HTML (Responsive Email Templates) cho Mangament.
 * Thiết kế chuẩn UI/UX, hỗ trợ hiển thị tối ưu trên Gmail, Outlook, Apple Mail (Mobile & Desktop).
 */

/**
 * Escape chuỗi HTML chống XSS trong email
 */
function escapeHtml(str) {
  if (!str) return "";
  return String(str).replace(/&/g, "&amp;").replace(/</g, "&lt;").replace(/>/g, "&gt;").replace(/"/g, "&quot;").replace(/'/g, "&#039;");
}

/**
 * Layout khung nền cơ bản dùng chung cho tất cả email
 */
export function baseEmailLayout({ title, previewText = "", content, headerBadge = "Mangament" }) {
  const year = new Date().getFullYear();
  const clientUrl = process.env.CLIENT_URL || "https://mangament.com";

  return `<!DOCTYPE html>
<html lang="vi">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <meta http-equiv="X-UA-Compatible" content="IE=edge">
  <title>${escapeHtml(title)}</title>
  <!--[if mso]>
  <style type="text/css">
    body, table, td { font-family: Arial, Helvetica, sans-serif !important; }
  </style>
  <![endif]-->
</head>
<body style="margin: 0; padding: 0; background-color: #f1f5f9; font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, Helvetica, Arial, sans-serif; -webkit-font-smoothing: antialiased; line-height: 1.6; color: #1e293b;">
  <!-- Preview Text ẩn trên inbox -->
  <div style="display: none; max-height: 0px; overflow: hidden; mso-hide: all;">
    ${escapeHtml(previewText)}
    &nbsp;&zwnj;&nbsp;&zwnj;&nbsp;&zwnj;&nbsp;&zwnj;&nbsp;&zwnj;&nbsp;&zwnj;&nbsp;&zwnj;&nbsp;&zwnj;
  </div>

  <table role="presentation" border="0" cellpadding="0" cellspacing="0" width="100%" style="background-color: #f1f5f9; padding: 30px 10px;">
    <tr>
      <td align="center">
        <!-- Container chính (max 600px) -->
        <table role="presentation" border="0" cellpadding="0" cellspacing="0" width="100%" style="max-width: 600px; background-color: #ffffff; border-radius: 12px; overflow: hidden; box-shadow: 0 4px 6px -1px rgba(0, 0, 0, 0.05), 0 2px 4px -2px rgba(0, 0, 0, 0.05); border: 1px solid #e2e8f0;">
          
          <!-- Thanh viền gradient thương hiệu trên đỉnh -->
          <tr>
            <td height="6" style="background: linear-gradient(90deg, #6366f1 0%, #8b5cf6 50%, #ec4899 100%);"></td>
          </tr>

          <!-- Header Logo -->
          <tr>
            <td style="padding: 28px 36px 20px 36px; border-bottom: 1px solid #f1f5f9; text-align: center;">
              <table role="presentation" border="0" cellpadding="0" cellspacing="0" width="100%">
                <tr>
                  <td align="center">
                    <span style="display: inline-block; font-size: 24px; font-weight: 800; letter-spacing: -0.5px; background: linear-gradient(135deg, #6366f1, #a855f7); -webkit-background-clip: text; color: #6366f1;">
                      📖 MANGAMENT
                    </span>
                    <span style="display: block; font-size: 11px; text-transform: uppercase; letter-spacing: 2px; color: #64748b; margin-top: 4px; font-weight: 600;">
                      ${escapeHtml(headerBadge)}
                    </span>
                  </td>
                </tr>
              </table>
            </td>
          </tr>

          <!-- Nội dung chính -->
          <tr>
            <td style="padding: 32px 36px;">
              ${content}
            </td>
          </tr>

          <!-- Footer -->
          <tr>
            <td style="background-color: #f8fafc; padding: 24px 36px; border-top: 1px solid #e2e8f0; text-align: center; color: #64748b; font-size: 13px;">
              <p style="margin: 0 0 10px 0;">
                <a href="${clientUrl}" style="color: #6366f1; text-decoration: none; font-weight: 600; margin: 0 10px;">Trang chủ</a> •
                <a href="${clientUrl}/stories" style="color: #6366f1; text-decoration: none; font-weight: 600; margin: 0 10px;">Khám phá truyện</a> •
                <a href="${clientUrl}/support" style="color: #6366f1; text-decoration: none; font-weight: 600; margin: 0 10px;">Hỗ trợ</a>
              </p>
              <p style="margin: 0 0 6px 0; font-size: 12px; color: #94a3b8;">
                Email này được gửi tự động từ hệ thống Mangament. Vui lòng không trả lời trực tiếp email này.
              </p>
              <p style="margin: 0; font-size: 12px; color: #94a3b8;">
                &copy; ${year} Mangament Platform. Tất cả các quyền được bảo lưu.
              </p>
            </td>
          </tr>
        </table>
      </td>
    </tr>
  </table>
</body>
</html>`;
}

/**
 * 1. Format: Email xác thực mã OTP
 */
export function renderOtpEmailTemplate({ otp, expiresInMinutes = 5 }) {
  const content = `
    <h2 style="margin: 0 0 12px 0; color: #0f172a; font-size: 20px; font-weight: 700;">
      Xác thực mã OTP của bạn 🔐
    </h2>
    <p style="margin: 0 0 20px 0; color: #475569; font-size: 15px;">
      Bạn vừa yêu cầu mã xác thực để đăng nhập hoặc thực hiện thao tác bảo mật trên <strong>Mangament</strong>. Vui lòng sử dụng mã OTP dưới đây:
    </p>

    <!-- Box OTP to nổi bật -->
    <div style="background: #f8fafc; border: 2px dashed #cbd5e1; border-radius: 10px; padding: 20px; text-align: center; margin: 24px 0;">
      <span style="font-family: 'Courier New', Courier, monospace; font-size: 36px; font-weight: 800; letter-spacing: 8px; color: #4f46e5; display: inline-block;">
        ${escapeHtml(otp)}
      </span>
      <p style="margin: 8px 0 0 0; font-size: 13px; color: #64748b;">
        ⏱️ Mã có hiệu lực trong vòng <strong>${expiresInMinutes} phút</strong>
      </p>
    </div>

    <!-- Hộp cảnh báo bảo mật -->
    <div style="background-color: #fef2f2; border-left: 4px solid #ef4444; padding: 12px 16px; border-radius: 0 6px 6px 0; margin-top: 20px;">
      <p style="margin: 0; font-size: 13px; color: #991b1b; line-height: 1.5;">
        <strong>⚠️ Lưu ý bảo mật:</strong> Tuyệt đối không chia sẻ mã này cho bất kỳ ai, kể cả nhân viên hỗ trợ của Mangament.
      </p>
    </div>
  `;

  return {
    subject: `[Mangament] Mã xác thực OTP của bạn: ${otp}`,
    html: baseEmailLayout({
      title: "Mã xác thực OTP - Mangament",
      previewText: `Mã xác thực OTP của bạn là ${otp}. Hiệu lực trong ${expiresInMinutes} phút.`,
      content,
      headerBadge: "Bảo mật tài khoản",
    }),
  };
}

/**
 * 2. Format: Email cấp lại mật khẩu mới (Forgot Password)
 */
export function renderNewPasswordEmailTemplate({ newPassword, clientUrl }) {
  const loginUrl = clientUrl ? `${clientUrl}/login` : `${process.env.CLIENT_URL || "https://mangament.com"}/login`;

  const content = `
    <h2 style="margin: 0 0 12px 0; color: #0f172a; font-size: 20px; font-weight: 700;">
      Khôi phục mật khẩu tài khoản 🔑
    </h2>
    <p style="margin: 0 0 16px 0; color: #475569; font-size: 15px;">
      Hệ thống đã nhận được yêu cầu cấp lại mật khẩu cho tài khoản của bạn. Dưới đây là mật khẩu đăng nhập mới tạm thời:
    </p>

    <!-- Khung hiển thị mật khẩu mới -->
    <div style="background: #f8fafc; border: 1px solid #e2e8f0; border-radius: 8px; padding: 16px; text-align: center; margin: 20px 0;">
      <span style="font-size: 12px; text-transform: uppercase; color: #64748b; font-weight: 600; display: block; margin-bottom: 6px;">Mật khẩu mới của bạn:</span>
      <span style="font-family: 'Courier New', Courier, monospace; font-size: 24px; font-weight: 700; color: #0f172a; background: #e2e8f0; padding: 4px 12px; border-radius: 6px; display: inline-block;">
        ${escapeHtml(newPassword)}
      </span>
    </div>

    <!-- Nút bấm Đăng nhập ngay -->
    <div style="text-align: center; margin: 26px 0;">
      <a href="${loginUrl}" style="background: linear-gradient(135deg, #6366f1 0%, #4f46e5 100%); color: #ffffff; padding: 12px 30px; font-size: 15px; font-weight: 700; text-decoration: none; border-radius: 8px; display: inline-block; box-shadow: 0 4px 6px -1px rgba(79, 70, 229, 0.3);">
        👉 Đăng nhập ngay
      </a>
    </div>

    <div style="background-color: #fffbeb; border-left: 4px solid #f59e0b; padding: 12px 16px; border-radius: 0 6px 6px 0;">
      <p style="margin: 0; font-size: 13px; color: #92400e; line-height: 1.5;">
        <strong>Khuyến nghị:</strong> Hãy đổi mật khẩu ngay sau khi đăng nhập thành công tại mục <em>Cài đặt tài khoản</em> để đảm bảo an toàn tuyệt đối.
      </p>
    </div>
  `;

  return {
    subject: `[Mangament] Mật khẩu mới cho tài khoản của bạn`,
    html: baseEmailLayout({
      title: "Khôi phục mật khẩu - Mangament",
      previewText: "Mật khẩu mới tạm thời cho tài khoản Mangament của bạn.",
      content,
      headerBadge: "Cấp lại mật khẩu",
    }),
  };
}

/**
 * 3. Format: Báo cáo trạng thái cập nhật truyện cho Biên tập viên / Quản trị viên
 */
export function renderUpdateStoryStatusEmailTemplate({ storyTitle, storyCoverArtUrl, success, log }) {
  const statusColor = success ? "#10b981" : "#ef4444";
  const statusBg = success ? "#ecfdf5" : "#fef2f2";
  const statusText = success ? "CẬP NHẬT THÀNH CÔNG" : "CẬP NHẬT THẤT BẠI";
  const statusIcon = success ? "✅" : "❌";

  const content = `
    <div style="display: flex; align-items: center; justify-content: space-between; margin-bottom: 20px;">
      <h2 style="margin: 0; color: #0f172a; font-size: 20px; font-weight: 700;">
        Báo cáo cập nhật truyện 📊
      </h2>
    </div>

    <!-- Badge Trạng thái -->
    <div style="background-color: ${statusBg}; border: 1px solid ${statusColor}; color: ${statusColor}; padding: 10px 16px; border-radius: 8px; font-weight: 700; font-size: 14px; margin-bottom: 20px; text-align: center;">
      ${statusIcon} ${statusText}
    </div>

    <!-- Thông tin truyện -->
    <table role="presentation" border="0" cellpadding="0" cellspacing="0" width="100%" style="margin-bottom: 20px; background: #f8fafc; border-radius: 8px; padding: 14px; border: 1px solid #e2e8f0;">
      <tr>
        ${
          storyCoverArtUrl
            ? `<td width="70" valign="top" style="padding-right: 14px;">
                <img src="${escapeHtml(storyCoverArtUrl)}" alt="${escapeHtml(storyTitle)}" width="70" style="border-radius: 6px; display: block; object-fit: cover; aspect-ratio: 3/4; border: 1px solid #cbd5e1;" />
              </td>`
            : ""
        }
        <td valign="middle">
          <p style="margin: 0 0 4px 0; font-size: 12px; color: #64748b; text-transform: uppercase; font-weight: 600;">Tên tác phẩm:</p>
          <h3 style="margin: 0; color: #0f172a; font-size: 17px; font-weight: 700;">${escapeHtml(storyTitle)}</h3>
        </td>
      </tr>
    </table>

    <!-- Khối Terminal Logs -->
    <p style="margin: 0 0 6px 0; font-size: 13px; font-weight: 600; color: #475569;">Chi tiết nhật ký thực thi (Execution Log):</p>
    <pre style="
      background-color: #0f172a;
      color: #38bdf8;
      padding: 16px;
      border-radius: 8px;
      font-family: 'SFMono-Regular', Consolas, 'Liberation Mono', Menlo, monospace;
      font-size: 12px;
      line-height: 1.5;
      overflow-x: auto;
      max-height: 250px;
      margin: 0;
      white-space: pre-wrap;
      word-break: break-all;
      border: 1px solid #1e293b;
    ">${escapeHtml(log || "Không có chi tiết log.")}</pre>
  `;

  return {
    subject: `[Mangament] Báo cáo cập nhật "${storyTitle}": ${success ? "Thành công" : "Thất bại"}`,
    html: baseEmailLayout({
      title: `Báo cáo cập nhật: ${storyTitle}`,
      previewText: `Kết quả cập nhật truyện "${storyTitle}": ${success ? "Thành công" : "Thất bại"}.`,
      content,
      headerBadge: "Hệ thống biên tập",
    }),
  };
}

/**
 * 4. Format: Thông báo truyện yêu thích có chương mới (Dành cho Độc giả)
 */
export function renderStoryUpdatedNotificationTemplate({ storyTitle, storyType = "manga", storyCoverArtUrl, storyUrl }) {
  const targetUrl = storyUrl || `${process.env.CLIENT_URL || "https://mangament.com"}/stories/${storyType}/${encodeURIComponent(storyTitle)}`;

  const content = `
    <h2 style="margin: 0 0 10px 0; color: #0f172a; font-size: 22px; font-weight: 800; text-align: center;">
      🎉 Truyện yêu thích vừa có chương mới!
    </h2>
    <p style="margin: 0 0 24px 0; color: #475569; font-size: 15px; text-align: center;">
      Bộ truyện nằm trong danh sách theo dõi của bạn vừa được cập nhật chương mới. Đừng bỏ lỡ những tình tiết kịch tính tiếp theo!
    </p>

    <!-- Card Truyện Nổi Bật -->
    <div style="background: #ffffff; border: 1px solid #e2e8f0; border-radius: 12px; padding: 20px; margin-bottom: 24px; box-shadow: 0 4px 6px -1px rgba(0, 0, 0, 0.05); text-align: center;">
      ${
        storyCoverArtUrl
          ? `<img src="${escapeHtml(storyCoverArtUrl)}" alt="${escapeHtml(storyTitle)}" style="max-width: 180px; width: 100%; border-radius: 8px; display: inline-block; box-shadow: 0 10px 15px -3px rgba(0,0,0,0.1); margin-bottom: 16px; border: 1px solid #cbd5e1;" />`
          : ""
      }
      <h3 style="margin: 0 0 6px 0; font-size: 19px; font-weight: 700; color: #1e293b;">
        ${escapeHtml(storyTitle)}
      </h3>
      <span style="display: inline-block; background: #e0e7ff; color: #4338ca; font-size: 12px; font-weight: 700; padding: 3px 10px; border-radius: 9999px; text-transform: uppercase;">
        ${escapeHtml(storyType)}
      </span>
    </div>

    <!-- Nút Đọc Ngay -->
    <div style="text-align: center; margin: 24px 0;">
      <a href="${targetUrl}" style="background: linear-gradient(135deg, #ec4899 0%, #8b5cf6 100%); color: #ffffff; padding: 14px 36px; font-size: 16px; font-weight: 700; text-decoration: none; border-radius: 30px; display: inline-block; box-shadow: 0 4px 14px rgba(236, 72, 153, 0.4); text-transform: uppercase; letter-spacing: 0.5px;">
        ⚡ ĐỌC NGAY BÂY GIỜ
      </a>
    </div>

    <p style="margin: 0; font-size: 13px; color: #94a3b8; text-align: center;">
      Bạn nhận được thông báo này vì đã thêm tác phẩm vào danh sách truyện yêu thích trên Mangament.
    </p>
  `;

  return {
    subject: `[Mangament] 🔥 "${storyTitle}" vừa cập nhật chương mới! Đọc ngay`,
    html: baseEmailLayout({
      title: `Chương mới: ${storyTitle}`,
      previewText: `Tác phẩm "${storyTitle}" bạn theo dõi vừa có chương mới. Khám phá ngay!`,
      content,
      headerBadge: "Thông báo chương mới",
    }),
  };
}

/**
 * 5. Format: Email chào mừng thành viên mới (Welcome Onboarding)
 */
export function renderWelcomeEmailTemplate({ userName = "Bạn", clientUrl }) {
  const targetUrl = clientUrl || process.env.CLIENT_URL || "https://mangament.com";

  const content = `
    <h2 style="margin: 0 0 12px 0; color: #0f172a; font-size: 22px; font-weight: 800; text-align: center;">
      Chào mừng ${escapeHtml(userName)} gia nhập Mangament! 🚀
    </h2>
    <p style="margin: 0 0 24px 0; color: #475569; font-size: 15px; text-align: center;">
      Cảm ơn bạn đã trở thành một phần của cộng đồng yêu truyện tranh. Chúng tôi rất hào hứng được đồng hành cùng bạn trên hành trình khám phá thế giới truyện đặc sắc.
    </p>

    <!-- 3 Điểm nổi bật -->
    <div style="margin: 20px 0;">
      <div style="padding: 12px; margin-bottom: 10px; background: #f8fafc; border-radius: 8px;">
        <strong style="color: #4338ca;">📚 Hàng ngàn bộ truyện đặc sắc:</strong>
        <p style="margin: 4px 0 0 0; font-size: 13px; color: #64748b;">Manga, Manhwa, Manhua và Light Novel được cập nhật liên tục mỗi ngày.</p>
      </div>
      <div style="padding: 12px; margin-bottom: 10px; background: #f8fafc; border-radius: 8px;">
        <strong style="color: #4338ca;">⭐ Tủ truyện thông minh:</strong>
        <p style="margin: 4px 0 0 0; font-size: 13px; color: #64748b;">Lưu truyện yêu thích, đồng bộ lịch sử đọc xuyên suốt các thiết bị.</p>
      </div>
      <div style="padding: 12px; background: #f8fafc; border-radius: 8px;">
        <strong style="color: #4338ca;">💬 Bình luận & Kết nối:</strong>
        <p style="margin: 4px 0 0 0; font-size: 13px; color: #64748b;">Chia sẻ cảm nghĩ, thảo luận sôi nổi cùng những độc giả cùng sở thích.</p>
      </div>
    </div>

    <!-- CTA -->
    <div style="text-align: center; margin: 28px 0 10px 0;">
      <a href="${targetUrl}/stories" style="background: linear-gradient(135deg, #6366f1 0%, #4f46e5 100%); color: #ffffff; padding: 13px 32px; font-size: 15px; font-weight: 700; text-decoration: none; border-radius: 8px; display: inline-block;">
        Bắt đầu khám phá ngay
      </a>
    </div>
  `;

  return {
    subject: `[Mangament] Chào mừng ${userName} đến với Mangament! 🚀`,
    html: baseEmailLayout({
      title: "Chào mừng bạn đến với Mangament",
      previewText: "Khám phá hàng ngàn bộ truyện tranh hấp dẫn và tận hưởng trải nghiệm đọc tuyệt vời!",
      content,
      headerBadge: "Thành viên mới",
    }),
  };
}

/**
 * 6. Format: Email cảnh báo bảo mật tài khoản (Security Alert)
 */
export function renderSecurityAlertEmailTemplate({ userName = "Bạn", action = "Đăng nhập mới", ipAddress = "N/A", userAgent = "N/A", time, clientUrl }) {
  const securityUrl = clientUrl ? `${clientUrl}/account/security` : `${process.env.CLIENT_URL || "https://mangament.com"}/account/security`;
  const eventTime = time || new Date().toLocaleString("vi-VN", { timeZone: "Asia/Ho_Chi_Minh" });

  const content = `
    <h2 style="margin: 0 0 12px 0; color: #b91c1c; font-size: 20px; font-weight: 700;">
      ⚠️ Cảnh báo bảo mật tài khoản
    </h2>
    <p style="margin: 0 0 18px 0; color: #475569; font-size: 15px;">
      Xin chào <strong>${escapeHtml(userName)}</strong>, hệ thống bảo mật Mangament vừa phát hiện hoạt động sau trên tài khoản của bạn:
    </p>

    <!-- Bảng thông tin hoạt động -->
    <table role="presentation" border="0" cellpadding="0" cellspacing="0" width="100%" style="background: #fef2f2; border: 1px solid #fecaca; border-radius: 8px; padding: 14px; font-size: 13px; margin-bottom: 20px;">
      <tr>
        <td style="padding: 6px 0; color: #7f1d1d; font-weight: 600;" width="120">Hoạt động:</td>
        <td style="padding: 6px 0; color: #991b1b; font-weight: 700;">${escapeHtml(action)}</td>
      </tr>
      <tr>
        <td style="padding: 6px 0; color: #7f1d1d; font-weight: 600;">Thời gian:</td>
        <td style="padding: 6px 0; color: #475569;">${escapeHtml(eventTime)}</td>
      </tr>
      <tr>
        <td style="padding: 6px 0; color: #7f1d1d; font-weight: 600;">Địa chỉ IP:</td>
        <td style="padding: 6px 0; color: #475569; font-family: monospace;">${escapeHtml(ipAddress)}</td>
      </tr>
      <tr>
        <td style="padding: 6px 0; color: #7f1d1d; font-weight: 600;">Thiết bị:</td>
        <td style="padding: 6px 0; color: #475569;">${escapeHtml(userAgent)}</td>
      </tr>
    </table>

    <p style="margin: 0 0 20px 0; font-size: 14px; color: #475569;">
      Nếu đây chính là bạn, bạn có thể yên tâm bỏ qua email này. Nếu <strong>KHÔNG PHẢI BẠN</strong>, hãy đổi mật khẩu và khóa phiên đăng nhập ngay lập tức:
    </p>

    <div style="text-align: center; margin: 20px 0;">
      <a href="${securityUrl}" style="background-color: #dc2626; color: #ffffff; padding: 12px 28px; font-size: 14px; font-weight: 700; text-decoration: none; border-radius: 6px; display: inline-block;">
        🛡️ Bảo vệ tài khoản ngay
      </a>
    </div>
  `;

  return {
    subject: `[Mangament] ⚠️ Cảnh báo bảo mật: ${action}`,
    html: baseEmailLayout({
      title: "Cảnh báo bảo mật tài khoản - Mangament",
      previewText: `Phát hiện hoạt động mới (${action}) trên tài khoản Mangament của bạn.`,
      content,
      headerBadge: "Cảnh báo bảo mật",
    }),
  };
}

export default {
  baseEmailLayout,
  renderOtpEmailTemplate,
  renderNewPasswordEmailTemplate,
  renderUpdateStoryStatusEmailTemplate,
  renderStoryUpdatedNotificationTemplate,
  renderWelcomeEmailTemplate,
  renderSecurityAlertEmailTemplate,
};
