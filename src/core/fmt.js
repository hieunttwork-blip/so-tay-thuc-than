// Định dạng tiền: trong game 1 đơn vị = 1.000 VNĐ.
export const vnd = (n) => `${(Math.round(n) * 1000).toLocaleString('vi-VN')} VNĐ`;
