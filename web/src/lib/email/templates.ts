import { appUrl } from "./send";

function esc(s: string) {
  return s.replace(/[&<>"']/g, (c) =>
    ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#39;" })[c]!
  );
}

/** Simple branded layout: teal header with logo, orange button, unsubscribe footer. */
export function layout(opts: {
  heading: string;
  lines: string[];
  buttonText: string;
  buttonUrl: string;
  unsubscribeUrl: string;
  unsubscribeLabel: string;
}) {
  const base = appUrl();
  const html = `<!doctype html><html><body style="margin:0;background:#f6f1e8;font-family:Arial,Helvetica,sans-serif;color:#1f1a14">
<table width="100%" cellpadding="0" cellspacing="0" style="background:#f6f1e8;padding:24px 12px"><tr><td align="center">
<table width="100%" cellpadding="0" cellspacing="0" style="max-width:520px;background:#fffdf9;border-radius:16px;overflow:hidden;border:1px solid #e6dccb">
<tr><td style="background:#12909b;padding:16px 24px">
<a href="${base}" style="text-decoration:none;color:#fff;font-size:20px;font-weight:bold">
<img src="${base}/logo-64.png" width="36" height="36" alt="" style="vertical-align:middle;border-radius:8px;margin-right:8px">RenoSwap&trade;</a></td></tr>
<tr><td style="padding:24px">
<h1 style="font-size:20px;margin:0 0 12px">${esc(opts.heading)}</h1>
${opts.lines.map((l) => `<p style="font-size:15px;line-height:1.5;margin:0 0 12px;color:#3a3229">${esc(l)}</p>`).join("")}
<p style="margin:20px 0"><a href="${opts.buttonUrl}" style="background:#d2602a;color:#fff;text-decoration:none;padding:12px 20px;border-radius:999px;font-weight:bold;display:inline-block">${esc(opts.buttonText)}</a></p>
</td></tr>
<tr><td style="padding:16px 24px;border-top:1px solid #e6dccb;font-size:12px;color:#6f675b">
You're getting this because you have alerts on at RenoSwap. <a href="${opts.unsubscribeUrl}" style="color:#0b6c75">${esc(opts.unsubscribeLabel)}</a> · <a href="${base}/alerts" style="color:#0b6c75">Manage alerts</a>
</td></tr></table></td></tr></table></body></html>`;
  const text = `${opts.heading}\n\n${opts.lines.join("\n\n")}\n\n${opts.buttonText}: ${opts.buttonUrl}\n\n--\n${opts.unsubscribeLabel}: ${opts.unsubscribeUrl}\nManage alerts: ${base}/alerts\n`;
  return { html, text };
}
