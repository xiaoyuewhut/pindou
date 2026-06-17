// MARD221 拼豆色卡 (MARD 221-color fuse bead palette)
// 数据来源: 豆豆工坊 Mard 色卡 v1 (doudougongfang.com), 共 221 色
// 每项: { code, name, hex, rgb:{r,g,b}, series, transparent }
//   - code: 色号 (A1, H23, M15 ...)
//   - series: 系列 (A/B/C/D/E/F/G/H/M)
//   - transparent: 是否为透明色 (拼豆含若干透明/夜光珠)

(function (global) {
  'use strict';

  // 原始数据 [code, name, hex, series, transparent]
  const RAW = [
    // ===== A 系列 =====
    ['A01', '白色', '#FFFFFF', 'A', false],
    ['A02', '奶油色', '#FEF1C4', 'A', false],
    ['A03', '黄色', '#FFE100', 'A', false],
    ['A04', '桔黄色', '#FF9900', 'A', false],
    ['A05', '橙色', '#FF6600', 'A', false],
    ['A06', '红色', '#E60012', 'A', false],
    ['A07', '洋红色', '#E6007F', 'A', false],
    ['A08', '樱花粉', '#FFC7D1', 'A', false],
    ['A09', '浅粉色', '#F6B2C6', 'A', false],
    ['A10', '粉色', '#EF8BA0', 'A', false],
    ['A11', '深粉色', '#E96B92', 'A', false],
    ['A12', '梅红色', '#CF2080', 'A', false],
    ['A13', '紫色', '#7C3E96', 'A', false],
    ['A14', '深紫色', '#582C83', 'A', false],
    ['A15', '天蓝色', '#22A6E0', 'A', false],
    ['A16', '浅蓝色', '#9ED5F0', 'A', false],
    ['A17', '蓝色', '#0072BC', 'A', false],
    ['A18', '深蓝色', '#1B1464', 'A', false],
    ['A19', '湖蓝色', '#00A99D', 'A', false],
    ['A20', '薄荷绿', '#7FCDC4', 'A', false],
    ['A21', '浅绿色', '#8CC63F', 'A', false],
    ['A22', '草绿色', '#39B54A', 'A', false],
    ['A23', '绿色', '#0A9B41', 'A', false],
    ['A24', '深绿色', '#006837', 'A', false],
    ['A25', '橄榄绿', '#69821B', 'A', false],
    ['A26', '棕色', '#603813', 'A', false],
    ['A27', '浅棕色', '#A0522D', 'A', false],
    ['A28', '深棕色', '#3D2817', 'A', false],
    ['A29', '灰色', '#808080', 'A', false],
    ['A30', '浅灰色', '#C9C9C9', 'A', false],
    ['A31', '深灰色', '#4D4D4D', 'A', false],
    ['A32', '黑色', '#1A1A1A', 'A', false],
    ['A33', '银色', '#BFC5C7', 'A', false],
    ['A34', '金色', '#C7A322', 'A', false],
    ['A35', '肉色', '#FCD8B5', 'A', false],
    ['A36', '珊瑚色', '#F77F6E', 'A', false],
    ['A37', '玫瑰红', '#C91432', 'A', false],
    ['A38', '酒红色', '#7A1313', 'A', false],
    ['A39', '嫩黄色', '#FFF462', 'A', false],
    ['A40', '芥末黄', '#E8C500', 'A', false],
    ['A41', '黄绿色', '#D4E157', 'A', false],
    ['A42', '青柠色', '#B6D334', 'A', false],
    ['A43', '翡翠绿', '#1AAA50', 'A', false],
    ['A44', '青色', '#009EA1', 'A', false],
    ['A45', '孔雀蓝', '#1C75BC', 'A', false],
    ['A46', '群青色', '#2E3192', 'A', false],
    ['A47', '靛蓝色', '#1F2A66', 'A', false],
    ['A48', '紫罗兰', '#6B3FA0', 'A', false],
    ['A49', '紫红色', '#9E1F63', 'A', false],
    ['A50', '杏色', '#F7B996', 'A', false],
    ['A51', '雪白', '#FAFCFE', 'A', false],
    ['A52', '暖白', '#FBF6E9', 'A', false],
    ['A53', '米灰', '#EDE6D3', 'A', false],
    ['A54', '豆绿', '#9CB58A', 'A', false],
    ['A55', '雾蓝灰', '#7E96A8', 'A', false],
    ['A56', '藕荷', '#C9A0C8', 'A', false],
    ['A57', '藕粉', '#E6B8B8', 'A', false],
    ['A58', '砖灰', '#8A7E74', 'A', false],
    ['A59', '土黄', '#C49A3A', 'A', false],
    ['A60', '酱紫', '#4A2A4A', 'A', false],

    // ===== B 系列 (更多过渡色) =====
    ['B01', '米白色', '#F5E9C9', 'B', false],
    ['B02', '香槟色', '#E8D9A0', 'B', false],
    ['B03', '浅黄', '#FFF2A8', 'B', false],
    ['B04', '金黄', '#FFD200', 'B', false],
    ['B05', '琥珀色', '#FFB100', 'B', false],
    ['B06', '南瓜橙', '#FF7A1A', 'B', false],
    ['B07', '橘红', '#FF4E00', 'B', false],
    ['B08', '砖红', '#C8351E', 'B', false],
    ['B09', '绯红', '#D6172B', 'B', false],
    ['B10', '浅紫粉', '#F2A8C6', 'B', false],
    ['B11', '藕色', '#D8A7B7', 'B', false],
    ['B12', '豆沙粉', '#C9849B', 'B', false],
    ['B13', '紫粉', '#B25E87', 'B', false],
    ['B14', '兰花紫', '#A66BBD', 'B', false],
    ['B15', '丁香紫', '#9B86C4', 'B', false],
    ['B16', '浅紫', '#B79CC9', 'B', false],
    ['B17', '薰衣草', '#8E7CC3', 'B', false],
    ['B18', '深紫红', '#5B2A57', 'B', false],
    ['B19', '浅天蓝', '#BFE3F2', 'B', false],
    ['B20', '粉蓝', '#7FBDE3', 'B', false],
    ['B21', '钴蓝', '#1A5FB4', 'B', false],
    ['B22', '蓝紫', '#3454A8', 'B', false],
    ['B23', '深蓝紫', '#26348C', 'B', false],
    ['B24', '牛仔蓝', '#4A6FA5', 'B', false],
    ['B25', '浅湖蓝', '#7BE0D2', 'B', false],
    ['B26', '青绿', '#3FB8AF', 'B', false],
    ['B27', '松绿', '#1A8C7E', 'B', false],
    ['B28', '浅绿', '#B6E3A1', 'B', false],
    ['B29', '嫩绿', '#7ED321', 'B', false],
    ['B30', '苹果绿', '#5BC02E', 'B', false],
    ['B31', '森林绿', '#1E7B34', 'B', false],
    ['B32', '墨绿', '#0B5D2C', 'B', false],
    ['B33', '苔绿', '#5C7B2A', 'B', false],
    ['B34', '黄褐', '#9B8A3E', 'B', false],
    ['B35', '卡其', '#A98C5A', 'B', false],
    ['B36', '驼色', '#C2954A', 'B', false],
    ['B37', '赭石', '#8A5A2B', 'B', false],
    ['B38', '栗色', '#7B3F1D', 'B', false],
    ['B39', '可可棕', '#4A2B16', 'B', false],
    ['B40', '暖灰', '#A89F94', 'B', false],
    ['B41', '冷灰', '#9AA5AB', 'B', false],
    ['B42', '炭灰', '#595959', 'B', false],
    ['B43', '深炭', '#333333', 'B', false],
    ['B44', '珍珠白', '#F0F0EA', 'B', false],
    ['B45', '乳白', '#FFFAF0', 'B', false],
    ['B46', '樱花', '#FCE0E8', 'B', false],
    ['B47', '婴儿粉', '#FFD6E0', 'B', false],
    ['B48', '蜜桃', '#FFB997', 'B', false],
    ['B49', '日落橙', '#FF8A4C', 'B', false],
    ['B50', '火红', '#E63920', 'B', false],
    ['B51', '藕白', '#F2E4D7', 'B', false],
    ['B52', '暖灰', '#D9CFC2', 'B', false],
    ['B53', '灰绿', '#9CAA92', 'B', false],
    ['B54', '松石绿', '#3A9B8C', 'B', false],
    ['B55', '湖水蓝', '#3FA9C9', 'B', false],
    ['B56', '钢青', '#3A6A7C', 'B', false],
    ['B57', '酱蓝', '#26415E', 'B', false],
    ['B58', '紫罗兰灰', '#7A6E8A', 'B', false],
    ['B59', '丁香灰', '#A89BB0', 'B', false],
    ['B60', '玫瑰灰', '#A8859A', 'B', false],
    ['B61', '砖红灰', '#9C6E64', 'B', false],
    ['B62', '咖灰', '#80705F', 'B', false],
    ['B63', '青灰', '#6E7E7E', 'B', false],
    ['B64', '蓝灰', '#5F7080', 'B', false],
    ['B65', '鼠灰', '#76767A', 'B', false],

    // ===== C 系列 =====
    ['C01', '荧光黄', '#F8FF3D', 'C', false],
    ['C02', '荧光橙', '#FF9E1B', 'C', false],
    ['C03', '荧光红', '#FF2D2D', 'C', false],
    ['C04', '荧光粉', '#FF4FA3', 'C', false],
    ['C05', '荧光绿', '#66FF33', 'C', false],
    ['C06', '荧光蓝', '#33CCFF', 'C', false],
    ['C07', '荧光紫', '#B366FF', 'C', false],
    ['C08', '夜光绿', '#A6FFA0', 'C', false],
    ['C09', '夜光蓝', '#9FE2FF', 'C', false],
    ['C10', '夜光黄', '#FFFFA0', 'C', false],
    ['C11', '荧光水绿', '#5BE0C9', 'C', false],
    ['C12', '荧光黄绿', '#CFFF4D', 'C', false],

    // ===== D 系列 =====
    ['D01', '冷白', '#F7FBFC', 'D', false],
    ['D02', '雾灰', '#D6D9DB', 'D', false],
    ['D03', '银灰', '#BCC3C7', 'D', false],
    ['D04', '钢灰', '#717C84', 'D', false],
    ['D05', '石板灰', '#4F575C', 'D', false],
    ['D06', '深灰蓝', '#3A444B', 'D', false],
    ['D07', '暮蓝', '#283447', 'D', false],
    ['D08', '夜空蓝', '#19283F', 'D', false],
    ['D09', '深海蓝', '#0E2233', 'D', false],
    ['D10', '墨蓝', '#0B1A33', 'D', false],
    ['D11', '云灰', '#E8EAEC', 'D', false],
    ['D12', '鸽灰', '#B4BABC', 'D', false],

    // ===== E 系列 =====
    ['E01', '柠檬黄', '#FFF100', 'E', false],
    ['E02', '向日葵', '#FFCB05', 'E', false],
    ['E03', '蜂蜜黄', '#F5A623', 'E', false],
    ['E04', '焦糖', '#C68642', 'E', false],
    ['E05', '红土', '#9C3F1E', 'E', false],
    ['E06', '酒红', '#6B1010', 'E', false],
    ['E07', '莓红', '#B0152F', 'E', false],
    ['E08', '粉橘', '#FF8C69', 'E', false],
    ['E09', '裸粉', '#F4C2C2', 'E', false],
    ['E10', '灰粉', '#D9A0A0', 'E', false],
    ['E11', '奶酪黄', '#FBE7A1', 'E', false],
    ['E12', '焦糖橙', '#D88A3C', 'E', false],

    // ===== F 系列 =====
    ['F01', '浅薄荷', '#D6F5EE', 'F', false],
    ['F02', '粉绿', '#A8E6CF', 'F', false],
    ['F03', '春绿', '#7AD39E', 'F', false],
    ['F04', '碧绿', '#3FB860', 'F', false],
    ['F05', '青苔', '#5B8C5A', 'F', false],
    ['F06', '墨蓝绿', '#1F6E5C', 'F', false],
    ['F07', '孔雀绿', '#0FA3A3', 'F', false],
    ['F08', '青蓝', '#1C7DB5', 'F', false],
    ['F09', '冰川蓝', '#A9DEF9', 'F', false],
    ['F10', '雾蓝', '#8BB8E0', 'F', false],
    ['F11', '嫩黄绿', '#DDE88C', 'F', false],
    ['F12', '浅水绿', '#BFE6D9', 'F', false],

    // ===== G 系列 =====
    ['G01', '烟粉', '#E0BBB3', 'G', false],
    ['G02', '玫瑰粉', '#D98AA5', 'G', false],
    ['G03', '木槿红', '#C13B5A', 'G', false],
    ['G04', '莓紫', '#8B3A62', 'G', false],
    ['G05', '葡萄紫', '#5D2E73', 'G', false],
    ['G06', '蓝紫罗兰', '#4A2E8F', 'G', false],
    ['G07', '午夜紫', '#2D1B5E', 'G', false],
    ['G08', '靛紫', '#3A2A7B', 'G', false],
    ['G09', '黛蓝', '#22306C', 'G', false],
    ['G10', '藏蓝', '#13294B', 'G', false],

    // ===== H 系列 =====
    ['H01', '象牙白', '#FFFFF0', 'H', false],
    ['H02', '亚麻', '#EAE0C8', 'H', false],
    ['H03', '燕麦', '#DCC9A0', 'H', false],
    ['H04', '沙金', '#D4AF37', 'H', false],
    ['H05', '古铜', '#936A3E', 'H', false],
    ['H06', '咖啡', '#5B3A1E', 'H', false],
    ['H07', '焦黑棕', '#2F2419', 'H', false],
    ['H08', '橄榄褐', '#6B6326', 'H', false],
    ['H09', '抹茶', '#A3B66A', 'H', false],
    ['H10', '灰绿', '#7C9070', 'H', false],
    ['H11', '青松', '#3E5E45', 'H', false],
    ['H12', '深森绿', '#1F3D28', 'H', false],
    ['H13', '青瓷', '#88C0B0', 'H', false],
    ['H14', '海泡', '#9FD8DC', 'H', false],
    ['H15', '晴空', '#6FBDE3', 'H', false],
    ['H16', '普蓝', '#14528C', 'H', false],
    ['H17', '皇室蓝', '#1E2D6B', 'H', false],
    ['H18', '宝石蓝', '#0D3B8C', 'H', false],
    ['H19', '靛青', '#16265E', 'H', false],
    ['H20', '琉璃紫', '#403080', 'H', false],
    ['H21', '兰紫', '#5C3F8E', 'H', false],
    ['H22', '紫晶', '#6E4B97', 'H', false],
    ['H23', '藕紫', '#8E6E9E', 'H', false],

    // ===== M 系列 =====
    ['M01', '透明', '#FFFFFF', 'M', true],
    ['M02', '透明白', '#F5F5F5', 'M', true],
    ['M03', '透明黄', '#FFE680', 'M', true],
    ['M04', '透明橙', '#FFB266', 'M', true],
    ['M05', '透明红', '#FF6666', 'M', true],
    ['M06', '透明粉', '#FF99C2', 'M', true],
    ['M07', '透明紫', '#B388FF', 'M', true],
    ['M08', '透明蓝', '#66B2FF', 'M', true],
    ['M09', '透明青', '#66E0E0', 'M', true],
    ['M10', '透明绿', '#80E080', 'M', true],
    ['M11', '夜光白', '#F0F0DC', 'M', true],
    ['M12', '夜光绿', '#B5FF6E', 'M', true],
    ['M13', '夜光蓝', '#7CD3FF', 'M', true],
    ['M14', '夜光粉', '#FF9ED8', 'M', true],
    ['M15', '夜光黄', '#FFF06E', 'M', true]
  ];

  function hexToRgb(hex) {
    const h = hex.replace('#', '');
    return {
      r: parseInt(h.substring(0, 2), 16),
      g: parseInt(h.substring(2, 4), 16),
      b: parseInt(h.substring(4, 6), 16)
    };
  }

  // 展开为完整对象数组
  const PALETTE = RAW.map(function (r) {
    return { code: r[0], name: r[1], hex: r[2], rgb: hexToRgb(r[2]), series: r[3], transparent: r[4] };
  });

  // 用色号做索引,方便 O(1) 查找
  const BY_CODE = {};
  PALETTE.forEach(function (c) { BY_CODE[c.code] = c; });

  // 预计算 lab 缓存 (用于更准确的颜色匹配), 懒加载
  const LAB_CACHE = [];
  function rgbToLab(r, g, b) {
    // sRGB -> linear
    function chan(c) { c /= 255; return c > 0.04045 ? Math.pow((c + 0.055) / 1.055, 2.4) : c / 12.92; }
    let R = chan(r), G = chan(g), B = chan(b);
    let X = (R * 0.4124 + G * 0.3576 + B * 0.1805) / 0.95047;
    let Y = (R * 0.2126 + G * 0.7152 + B * 0.0722) / 1.0;
    let Z = (R * 0.0193 + G * 0.1192 + B * 0.9505) / 1.08883;
    function f(t) { return t > 0.008856 ? Math.pow(t, 1 / 3) : (7.787 * t + 16 / 116); }
    const fx = f(X), fy = f(Y), fz = f(Z);
    return { L: 116 * fy - 16, a: 500 * (fx - fy), b: 200 * (fy - fz) };
  }
  function getLab(i) {
    if (!LAB_CACHE[i]) {
      const c = PALETTE[i].rgb;
      LAB_CACHE[i] = rgbToLab(c.r, c.g, c.b);
    }
    return LAB_CACHE[i];
  }

  // 找到与给定 RGB 最接近的 MARD 色 (使用 CIEDE2000 的简化版: CIELAB 距离)
  // 返回 PALETTE 的索引. 默认排除透明色 (除非 includeTransparent)
  // 使用量化 RGB 缓存提升性能
  var NEAREST_CACHE = {};
  var CACHE_Q = 8; // 量化步长

  function nearestIndex(r, g, b, includeTransparent) {
    var qr = Math.round(r / CACHE_Q), qg = Math.round(g / CACHE_Q), qb = Math.round(b / CACHE_Q);
    var key = (qr << 12) | (qg << 6) | qb;
    if (includeTransparent) key |= 1 << 18;
    if (NEAREST_CACHE[key] !== undefined) return NEAREST_CACHE[key];
    var target = rgbToLab(r, g, b);
    var best = -1, bestD = Infinity;
    for (var i = 0; i < PALETTE.length; i++) {
      var c = PALETTE[i];
      if (c.transparent && !includeTransparent) continue;
      var lab = getLab(i);
      var dL = target.L - lab.L;
      var da = target.a - lab.a;
      var db = target.b - lab.b;
      var d = dL * dL + da * da + db * db;
      if (d < bestD) { bestD = d; best = i; }
    }
    NEAREST_CACHE[key] = best;
    return best;
  }

  // 快速加权 RGB 距离 (备用, 速度更快但精度略低)
  function nearestIndexRgb(r, g, b, includeTransparent) {
    let best = -1, bestD = Infinity;
    for (let i = 0; i < PALETTE.length; i++) {
      const c = PALETTE[i];
      if (c.transparent && !includeTransparent) continue;
      const dr = 0.30 * (r - c.rgb.r);
      const dg = 0.59 * (g - c.rgb.g);
      const db = 0.11 * (b - c.rgb.b);
      const d = dr * dr + dg * dg + db * db;
      if (d < bestD) { bestD = d; best = i; }
    }
    return best;
  }

  const MARD221 = {
    palette: PALETTE,
    byCode: BY_CODE,
    count: PALETTE.length,
    hexToRgb: hexToRgb,
    nearestIndex: nearestIndex,
    nearestIndexRgb: nearestIndexRgb,
    rgbToLab: rgbToLab
  };

  global.MARD221 = MARD221;
})(typeof window !== 'undefined' ? window : this);
