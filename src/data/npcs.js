// Nhân vật: mỗi người một giọng, một câu chuyện món ăn. {name} sẽ được thay bằng tên người chơi.
// topics: 3 chủ đề hỏi (mỗi chủ đề tặng quà một lần). asks: 3 lời nhờ "nấu tặng" theo thứ tự (đều là món ở địa điểm của họ).
// look: dùng cho tranh chân dung SVG (art/people.js).

export const NPCS = {
  'bac-ba': {
    name: 'Bác Ba', title: 'Chủ quán phở đầu ngõ', loc: 'b1',
    look: { skin: '#e2b48c', hair: '#d8d8d8', style: 'short', hat: 'none', outfit: '#8a4a2a', acc: 'apron' },
    greet: 'Lại đây, {name}. Quán bác ở đầu ngõ này đã nấu phở từ hồi bố cháu còn nhỏ xíu đấy.',
    topics: [
      ['Hỏi về nồi nước dùng', 'Xương phải hầm từ đêm, lửa nhỏ liu riu. Vội một chút là nước đục, ngọt không thấu. Nghề này chậm mà chắc, cháu ạ.'],
      ['Hỏi về mùi quế hồi', 'Nướng thơm quế hồi, gừng, hành rồi mới thả vào nồi. Thơm vừa đủ, đừng lấn mùi thịt bò.'],
      ['Hỏi về cuốn sổ tay', 'Cuốn sổ cũ của ông cháu à? Nó từng thiếu mấy trang. Nghe đâu rơi rớt đâu đó ba miền. Cháu đi nhiều thì để ý nhé.'],
    ],
    asks: [
      ['Cháu nấu bác bát phở bò nhé? Bác muốn nếm xem tay nghề cháu thế nào.', 'Ngon đấy! Nước dùng trong, vị vừa. Cầm lấy, coi như tiền công.'],
      ['Hôm nay bác thèm bún chả. Nướng sao cho thơm khói, cháu nhé.', 'Chả thơm quá, chấm nước mắm vừa miệng. Bác phục cháu rồi.'],
      ['Món cuối: chả cá Lã Vọng. Thì là phải cho cuối cùng nhé.', 'Đúng vị xưa. Bác tặng cháu một trang sổ rách bác giữ bấy lâu. Biết đâu cháu cần.'],
    ],
    idle: ['Nay quán đông không? Nhớ nghỉ ngơi đấy.', 'Nấu ăn là nấu bằng tâm, {name} ạ.'],
  },
  'co-sen': {
    name: 'Cô Sen', title: 'Người bán cốm làng Vòng', loc: 'b2',
    look: { skin: '#f0c9a0', hair: '#2a1a14', style: 'bun', hat: 'nonla', outfit: '#6f9a5a', acc: 'flower' },
    greet: 'Cốm mới đây, {name} ơi! Thơm mùi lúa non, cháu hít thử đi.',
    topics: [
      ['Hỏi cách làm cốm', 'Gặt lúa nếp lúc còn sữa, rang, giã, sàng. Mỗi việc chậm rãi. Cốm không chịu được vội vàng.'],
      ['Hỏi về lá sen', 'Gói cốm bằng lá sen, mùi thơm thấm vào nhau. Lá sen mà thiếu thì cốm kém duyên liền.'],
      ['Hỏi chuyện chiều Hồ Tây', 'Chiều gió hồ, cô gánh cốm đi bán, nghe tiếng sóng vỗ. Nhớ mãi những buổi như thế.'],
    ],
    asks: [
      ['Cháu làm giúp cô món bánh tôm giòn rụm nhé, cô nhớ vị ấy lắm.', 'Giòn quá! Tôm vàng ươm. Cảm ơn cháu nhiều.'],
      ['Nem rán Hà Nội thì Tết nào nhà cô cũng có. Cháu thử làm xem.', 'Nem vàng giòn, thơm đúng kiểu. Cô tặng cháu chút quà quê.'],
      ['Chè cốm nhé. Ngọt thanh thôi, đừng ngọt gắt.', 'Ngọt dịu, thơm mùi cốm. Cô đưa cháu một trang sổ cũ cô nhặt được ven hồ.'],
    ],
    idle: ['Gió hôm nay mát, cháu ngồi nghỉ chút đi.', 'Ai có duyên với cốm là có duyên với đất.'],
  },
  'chu-tam': {
    name: 'Chú Tám', title: 'Chủ quán bánh đa cua', loc: 'b3',
    look: { skin: '#cf9a6a', hair: '#1f1612', style: 'short', hat: 'cap', outfit: '#3a6a8a', acc: 'mustache' },
    greet: 'Ha ha, thêm một thực khách từ phố lên hả {name}? Vào đây! Chú Tám nấu bánh đa cua mà không ai chê!',
    topics: [
      ['Hỏi về cua đồng', 'Cua phải tươi, giã nhuyễn lọc lấy nước, riêu nổi lên từng mảng. Chú nấu từ khi tóc còn đen đấy.'],
      ['Hỏi về cảng Hải Phòng', 'Tàu ra vào suốt ngày. Thủy thủ nào ghé cũng phải ăn một bát nóng rồi mới ra khơi.'],
      ['Hỏi về bánh mì cay', 'Ớt chú tự làm, cay chảy nước mắt luôn! Nhưng ăn xong thấy sướng, lạ không?'],
    ],
    asks: [
      ['Làm cho chú bát bánh đa cua nào, xem cháu học lỏm được mấy phần!', 'Được đấy! Riêu nổi đẹp, vị đậm. Chú trả công đàng hoàng nhé.'],
      ['Bún cá cay! Cay vừa đủ ra mồ hôi thôi nhé.', 'Ha ha, cay đúng điệu. Cháu có năng khiếu đấy!'],
      ['Bánh mì cay cuối cùng. Nướng vừa vàng, không cháy nhé.', 'Giòn thơm, cay nồng. Cầm trang sổ này đi, chú nhặt dưới bến cảng, chữ viết lạ lắm.'],
    ],
    idle: ['Cười lên cho vui cửa vui nhà, {name}!', 'Biển lớn mà còn chịu nhường sông, mình nấu ăn thì kiên nhẫn chút.'],
  },
  'a-lenh': {
    name: 'A Lềnh', title: 'Người dẫn đường bản cao', loc: 'b4',
    look: { skin: '#c99468', hair: '#14100e', style: 'short', hat: 'khan', outfit: '#9a2a4a', acc: 'none' },
    greet: 'Chào {name}. Đường lên bản dài, nhưng cảnh đẹp. A Lềnh dẫn cho.',
    topics: [
      ['Hỏi về mắc khén', 'Hạt thơm trong rừng, mình nướng rồi giã. Ướp thịt, thơm lắm. Mùa nào cũng nhớ.'],
      ['Hỏi về xôi ngũ sắc', 'Mỗi màu là một loại lá. Mẹ mình dạy từ nhỏ. Làm xôi không vội đâu.'],
      ['Hỏi về bếp lửa', 'Nhà sàn có bếp ở giữa. Cả nhà quây lại, ăn, nói chuyện. Thịt gác bếp là để dành ăn tết.'],
    ],
    asks: [
      ['Làm cho mình món thắng cố. Mình nhớ nhà.', 'Vị này đúng rồi. Mình cảm ơn, ít nói nhưng thật lòng.'],
      ['Xôi ngũ sắc nhé. Mỗi màu phải rõ ràng.', 'Đẹp quá. Mẹ mình thấy chắc vui lắm.'],
      ['Lẩu cá hồi. Nước chua thanh, cá không nát.', 'Ngon. Cầm cái này, trang giấy lạ mình nhặt được dưới suối.'],
    ],
    idle: ['Trời sắp mưa mù, đi cẩn thận.', 'Núi không cần nhiều lời.'],
  },
  'ba-nhan': {
    name: 'Bà Nhàn', title: 'Bà bán hải sản ở bến', loc: 'b5',
    look: { skin: '#d8a878', hair: '#b8b0a8', style: 'bun', hat: 'nonla', outfit: '#4a7a8a', acc: 'none' },
    greet: 'Hàng tươi rói đây! Mua thì tính giá, hỏi chuyện thì miễn phí, {name} nhé.',
    topics: [
      ['Hỏi cách chọn mực', 'Mực tươi mắt trong, thân cứng, ấn vào thấy dai. Mực ươn là bà bỏ không bán.'],
      ['Hỏi về vịnh', 'Sáng sớm sương phủ, thuyền ra khơi, bà ngồi bến đếm từng mẻ. Vịnh đẹp mà cũng nhiều việc lắm.'],
      ['Hỏi về cơm cháy', 'Cơm cháy phải giòn mà không cứng, rưới mỡ hành mới ngon. Làm hoài mới đều tay.'],
    ],
    asks: [
      ['Chả mực bà mê lắm. Cháu giã mực thật dai nhé.', 'Dai giòn đúng điệu. Bà sòng phẳng, đây là tiền công.'],
      ['Cơm cháy chà bông, làm sao cho giòn tan nhé.', 'Giòn! Bà phải mua thêm của cháu.'],
      ['Ốc luộc sả gừng. Phải cho sả đập dập.', 'Thơm nức. Bà tặng cháu trang sổ bà thấy kẹp trong giỏ ốc, chắc của ai đánh rơi.'],
    ],
    idle: ['Có mua thêm hải sản không cháu?', 'Biển cho gì ăn nấy, đừng tham.'],
  },
  'o-bay': {
    name: 'O Bảy', title: 'Bà bán bún sả ruốc', loc: 'c1',
    look: { skin: '#e0b488', hair: '#9a9088', style: 'bun', hat: 'nonla', outfit: '#7a3a6a', acc: 'none' },
    greet: 'Mô rứa, {name}? Vô đây ngồi, o bưng bát bún nóng cho.',
    topics: [
      ['Hỏi về mắm ruốc', 'Mắm ruốc làm từ biển, phải khéo mới thơm. Pha nước dùng một chút thôi, nhiều thì lấn vị.'],
      ['Hỏi về sông Hương', 'Chiều xuống sông Hương lặng, o ngồi gói bánh, nghe tiếng chuông xa. Huế là rứa đó.'],
      ['Hỏi về bánh nhỏ', 'Bánh Huế nhỏ xíu mà làm tỉ mẩn. Đĩa nào cũng phải xinh, ăn mới ngon.'],
    ],
    asks: [
      ['Con nấu o tô bún bò Huế nghe. Sả đập dập cho thơm.', 'Răng mà ngon rứa! Nước thơm sả, cay vừa. O mừng.'],
      ['Bánh bèo nhé. Tôm cháy rắc đều trên mặt.', 'Xinh xắn, ăn ngon. Con có khiếu lắm.'],
      ['Cơm hến cuối cùng. Hến phải xào thơm, rau sống giòn.', 'Ngon đúng điệu Huế. O gửi con trang giấy cũ rơi đâu hồi nào.'],
    ],
    idle: ['Nghỉ ngơi chút rồi đi tiếp nghe con.', 'Món Huế ăn chậm mới thấm.'],
  },
  'chu-sau': {
    name: 'Chú Sáu', title: 'Đầu bếp mì Quảng', loc: 'c2',
    look: { skin: '#c8905e', hair: '#2a1e18', style: 'short', hat: 'bere', outfit: '#d9a23c', acc: 'glasses' },
    greet: 'Vô đây! Tô mì Quảng nhà chú, ít nước mà đậm đà. Ăn rồi sẽ nhớ {name} nhé.',
    topics: [
      ['Hỏi về sợi mì', 'Sợi mì tráng từ bột gạo, cắt tay, hơi dày. Nghệ cho màu vàng, ăn kèm bánh tráng nướng.'],
      ['Hỏi về bánh xèo', 'Bánh xèo miền Trung nhỏ, giòn. Đổ bột vào chảo nóng là nghe xèo xèo, mê lắm.'],
      ['Hỏi về cầu Rồng', 'Đêm cuối tuần cầu phun lửa, người đông nghịt. Quán chú cũng đông theo!'],
    ],
    asks: [
      ['Nấu cho chú tô mì Quảng nào, để chú xem tay nghề!', 'Đậm đà đấy! Chú khoái. Thưởng cho cháu!'],
      ['Bún mắm nêm nhé, mắm nêm phải pha cho thơm dứa.', 'Hay đó! Ăn một lần nhớ mãi.'],
      ['Bánh xèo miền Trung, đổ mỏng thật mỏng.', 'Giòn rụm! Cầm lấy trang giấy rách này, chú nhặt trong tiệm sách cũ.'],
    ],
    idle: ['Đi biển chưa cháu? Nước xanh lắm.', 'Ăn no rồi hãy đi đường xa!'],
  },
  'chi-hai': {
    name: 'Chị Hai', title: 'Nghệ nhân phố cổ Hội An', loc: 'c3',
    look: { skin: '#ecc7a0', hair: '#1a1210', style: 'long', hat: 'none', outfit: '#c24a32', acc: 'flower' },
    greet: 'Chào {name}. Phố cổ lên đèn rồi, mình đi chậm thôi, đừng vội.',
    topics: [
      ['Hỏi về cao lầu', 'Sợi cao lầu phải ngâm nước tro, dai và thơm. Người ta kể nước giếng cổ góp phần, chị không rõ, chị chỉ biết ăn là ghiền.'],
      ['Hỏi về đèn lồng', 'Mỗi chiếc đèn là một màu. Chị làm mà thấy lòng yên. Cũng như nấu ăn vậy.'],
      ['Hỏi về bánh vạc', 'Bánh trắng như hoa hồng, làm tỉ mẩn từng cái. Nhìn thôi đã đẹp rồi.'],
    ],
    asks: [
      ['Chị muốn ăn cao lầu. Em nấu thử chị nếm nhé.', 'Ngon, em nêm khéo tay. Chị gửi chút tiền công.'],
      ['Cơm gà Hội An. Gà phải xé tay, trộn hành tím.', 'Thơm vị gà, cơm vàng đẹp mắt. Em giỏi lắm.'],
      ['Bánh mì kẹp đầy đặn nhé. Chị thích sốt đậm.', 'Giòn thơm! Em cầm trang giấy này, chị nhặt được bên giếng cổ.'],
    ],
    idle: ['Tối nay thả đèn hoa đăng không em?', 'Chậm một chút là đẹp.'],
  },
  'ba-sau': {
    name: 'Bà Sáu', title: 'Bà bán cháo lươn', loc: 'c4',
    look: { skin: '#d09a68', hair: '#c8c0b8', style: 'bun', hat: 'khan', outfit: '#5a6a3a', acc: 'none' },
    greet: 'Con ơi, vô đây ăn bát cháo cho ấm bụng. Bà Sáu nấu cháo lươn ba chục năm rồi.',
    topics: [
      ['Hỏi cách làm lươn', 'Lươn phải làm sạch nhớt, xào săn mới thơm. Nghề cực nhưng bà thương nghề.'],
      ['Hỏi về nhút', 'Nhút là mít non muối, ăn kèm bữa cơm. Mặn mà, mộc mạc, người xa quê nhớ lắm.'],
      ['Hỏi về mùa gió Lào', 'Hè nóng như đổ lửa, bà vẫn ngồi nấu. Quen rồi con ạ.'],
    ],
    asks: [
      ['Con nấu bà bát cháo lươn nghe, bà muốn nếm lại vị xưa.', 'Đúng vị rồi. Bà cảm ơn con.'],
      ['Bánh mướt chấm nước mắm. Bánh phải thật mỏng.', 'Mỏng mịn, ngon lắm. Bà thương con.'],
      ['Kẹo cu đơ ngọt bùi, con ráng làm thử.', 'Ngọt thơm, giòn bùi. Bà cho con tờ giấy bà giữ trong hòm từ lâu.'],
    ],
    idle: ['Ăn cho no rồi đi đường xa con.', 'Nghèo mà có tình nghĩa là quý.'],
  },
  'bac-tu': {
    name: 'Bác Tư', title: 'Ngư dân Nam Trung Bộ', loc: 'c5',
    look: { skin: '#b8844e', hair: '#7a726a', style: 'short', hat: 'nonla', outfit: '#3a5a7a', acc: 'mustache' },
    greet: 'Biển hôm nay êm, {name}. Bác vừa kéo lưới về, ghé ăn bún sứa cho mát.',
    topics: [
      ['Hỏi về sứa', 'Sứa phải rửa kỹ, ngâm chua, giòn sần sật. Món này mát lắm.'],
      ['Hỏi về tháp Chăm', 'Tháp đỏ đứng trên đồi, bác nhìn từ nhỏ. Chẳng biết bao lâu rồi, chỉ biết đẹp.'],
      ['Hỏi về bánh xèo tôm nhảy', 'Tôm phải còn nhảy lúc đổ vào bột. Tươi mới giòn ngọt.'],
    ],
    asks: [
      ['Bún sứa mát lạnh nhé, bác thèm.', 'Giòn, thanh. Bác khen đấy.'],
      ['Bánh xèo tôm nhảy! Vỏ giòn, tôm đỏ au.', 'Tuyệt! Tiền công bác gửi cháu.'],
      ['Nem nướng Ninh Hòa, cuốn rau thật nhiều.', 'Ngon quá. Cháu cầm trang giấy này, bác thấy trôi dạt vào bờ.'],
    ],
    idle: ['Gió biển hôm nay mặn lắm.', 'Ra khơi phải biết canh gió, nấu ăn cũng phải canh lửa.'],
  },
  'chu-bay': {
    name: 'Chú Bảy', title: 'Chủ xe hủ tiếu đêm', loc: 'n1',
    look: { skin: '#c8905e', hair: '#241a14', style: 'short', hat: 'cap', outfit: '#2a6a8a', acc: 'apron' },
    greet: 'Ê {name}, lại đây! Sài Gòn không ngủ, xe hủ tiếu chú cũng không ngủ!',
    topics: [
      ['Hỏi về hủ tiếu', 'Nước dùng ngọt xương, hủ tiếu dai. Thêm chút tôm thịt là xong. Món đơn giản mà đậm đà.'],
      ['Hỏi về cà phê vỉa hè', 'Ly cà phê sữa đá là nhịp sống thành phố. Sáng nào chú cũng uống một ly trước khi dọn hàng.'],
      ['Hỏi về xe đẩy', 'Chiếc xe này chở cả cuộc đời chú. Đường nào chú cũng đi qua.'],
    ],
    asks: [
      ['Cơm tấm sườn bì chả, nướng sườn ngọt thơm nhé!', 'Ngon! Chú mê. Nè, chút tiền công.'],
      ['Hủ tiếu Nam Vang, nước dùng phải ngọt thanh.', 'Chuẩn vị! Chú nể cháu.'],
      ['Ly cà phê sữa đá, đậm mà không đắng gắt.', 'Đã quá! Cầm trang giấy này, chú thấy kẹp trong quyển sách cũ ở tiệm sách Nguyễn Huệ.'],
    ],
    idle: ['Khuya rồi, nghỉ một chút đi cháu.', 'Sài Gòn mà, món gì cũng có.'],
  },
  'co-nam': {
    name: 'Cô Năm', title: 'Chủ ghe chợ nổi', loc: 'n2',
    look: { skin: '#d9a070', hair: '#2a1e18', style: 'braid', hat: 'nonla', outfit: '#d9803c', acc: 'none' },
    greet: 'Ghe cô đây! Hàng gì cũng có, {name} ơi. Treo cây bẹo là bán đó nghen!',
    topics: [
      ['Hỏi về cây bẹo', 'Treo gì là bán nấy. Trái cây, hủ tiếu, cà phê. Ai nhìn cũng biết.'],
      ['Hỏi về lẩu mắm', 'Mắm phải ngon, rau phải tươi. Nồi lẩu mắm ăn cả nhà quây quần.'],
      ['Hỏi về mùa nước nổi', 'Nước lên rồi cá về đầy. Dân sông nước sống nhờ con nước.'],
    ],
    asks: [
      ['Lẩu mắm cô thèm quá. Cháu nấu cô ăn thử.', 'Đậm vị! Cô vui. Hồi nào quay lại nữa nghen.'],
      ['Bánh cống giòn rụm nhé, tôm ở trên.', 'Giòn! Ngon ghê. Tiền công nè.'],
      ['Chè ba màu mát lạnh, cô nhớ hồi nhỏ.', 'Ngọt thanh. Nè, trang giấy cô vớt được dưới sông, chữ nhòe nhòe.'],
    ],
    idle: ['Sông nước êm, bán cũng đắt hàng.', 'Đừng quên ăn sáng nghen cháu.'],
  },
  'ba-muoi': {
    name: 'Bà Mười', title: 'Thợ làm kẹo dừa', loc: 'n3',
    look: { skin: '#dcb088', hair: '#d0c8c0', style: 'bun', hat: 'khan', outfit: '#4f9a78', acc: 'none' },
    greet: 'Con ơi, vô xem bà nấu kẹo dừa. Ngọt thơm cả xóm!',
    topics: [
      ['Hỏi về nấu kẹo', 'Nạo dừa, vắt nước cốt, nấu với đường tới khi quánh. Phải khuấy đều tay, ngừng là cháy.'],
      ['Hỏi về cây dừa', 'Cây dừa cho trái, cho lá, cho thân. Dân xứ này sống nhờ nó.'],
      ['Hỏi về chuối nếp nướng', 'Chuối nướng than, rưới nước cốt dừa. Món ăn chiều thơm lừng.'],
    ],
    asks: [
      ['Hủ tiếu Mỹ Tho bà thèm. Con nấu bà ăn thử nghen.', 'Ngon! Con khéo tay lắm. Bà cho con chút quà.'],
      ['Cá lóc nướng trui, cuốn bánh tráng rau sống.', 'Thơm khói! Bà khen con nè.'],
      ['Chuối nếp nướng nước cốt dừa, bà nhớ vị xưa.', 'Giống quá! Bà trao con tờ giấy bà giữ kỹ, xem coi có giúp gì không.'],
    ],
    idle: ['Nghỉ chút uống ly nước dừa con.', 'Làm kẹo phải kiên nhẫn.'],
  },
  'chu-tu': {
    name: 'Chú Tư', title: 'Nông dân mùa nước nổi', loc: 'n4',
    look: { skin: '#b88450', hair: '#4a4038', style: 'short', hat: 'nonla', outfit: '#6a7a3a', acc: 'mustache' },
    greet: 'Chào {name}. Mùa này nước nổi, cá linh về đầy. Điên điển nở vàng cả đồng.',
    topics: [
      ['Hỏi về cá linh', 'Cá linh nhỏ mà ngọt thịt. Nấu lẩu với bông điên điển thì khỏi chê.'],
      ['Hỏi về điên điển', 'Hoa vàng nở theo mùa nước. Hái sáng sớm là ngon nhất.'],
      ['Hỏi về đường thốt nốt', 'Lấy nước từ bông thốt nốt nấu cô đặc. Ngọt thơm riêng, không giống đường mía.'],
    ],
    asks: [
      ['Bún cá Châu Đốc, nước vàng nghệ, thơm sả.', 'Ngon! Chú gửi cháu chút tiền công.'],
      ['Lẩu cá linh bông điên điển. Món của mùa nước nổi đó cháu.', 'Đúng vị quê chú. Cảm ơn cháu.'],
      ['Cá kho tộ ăn với cơm trắng nóng, chú nhớ bữa cơm nhà.', 'Đậm đà! Chú trao cháu trang giấy chú tìm thấy trong ghe cũ.'],
    ],
    idle: ['Nước lên rồi, cá về đầy ghe.', 'Chậm rãi mà chắc chắn, cháu ạ.'],
  },
  'anh-hai': {
    name: 'Anh Hai', title: 'Ngư dân đảo ngọc', loc: 'n5',
    look: { skin: '#b88450', hair: '#1a1410', style: 'short', hat: 'bere', outfit: '#2a8a9a', acc: 'glasses' },
    greet: 'Chào {name}! Biển hôm nay đẹp lắm, ghe anh vừa về đầy cá. Ăn thử chứ?',
    topics: [
      ['Hỏi về nước mắm', 'Nước mắm phải ủ lâu mới thơm. Anh nghe kể có người ủ hàng năm, kiên nhẫn lắm.'],
      ['Hỏi về cá trích', 'Cá tươi cuốn bánh tráng, chấm nước mắm. Mát và ngon.'],
      ['Hỏi về rừng đước', 'Cà Mau rừng đước xanh ngút ngàn. Cua ở đó ngon nổi tiếng.'],
    ],
    asks: [
      ['Bún quậy ăn là phải trộn đều. Cháu nấu anh thử nghen.', 'Ngon! Chanh ớt đủ vị. Anh vui.'],
      ['Cua rang muối, giòn mặn đậm đà.', 'Quá đã! Anh gửi cháu chút quà.'],
      ['Sò điệp nướng mỡ hành, thơm nức nhé.', 'Thơm tuyệt! Cầm trang giấy này, anh nhặt ngoài đảo, chữ lạ lạ.'],
    ],
    idle: ['Gió đảo mát lắm, ngồi nghỉ chút đi.', 'Biển rộng, lòng cũng phải rộng.'],
  },
};
export const NPC_LIST = Object.values(NPCS);
