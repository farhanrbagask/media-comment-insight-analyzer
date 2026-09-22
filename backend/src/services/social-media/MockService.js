/**
 * MockService — returns realistic-looking dummy data for development/testing.
 * Activate by setting USE_MOCK_SERVICE=true in backend/.env
 *
 * This ensures the full pipeline can be tested without real API credentials.
 */

const MOCK_COMMENTS_INSTAGRAM = [
  { commentId: 'ig_001', username: 'user_andi', text: 'Produknya bagus banget! Kualitas premium sekali.', publishedAt: '2026-09-01T08:00:00Z', likeCount: 12 },
  { commentId: 'ig_002', username: 'sari_fans', text: 'Pelayanannya ramah dan cepat, suka banget!', publishedAt: '2026-09-01T09:15:00Z', likeCount: 8 },
  { commentId: 'ig_003', username: 'budiman99', text: 'Harganya terlalu mahal untuk kualitas segini.', publishedAt: '2026-09-01T10:30:00Z', likeCount: 3 },
  { commentId: 'ig_004', username: 'rina_xyz', text: 'Pengirimannya lambat banget, sudah 2 minggu belum sampai.', publishedAt: '2026-09-01T11:45:00Z', likeCount: 25 },
  { commentId: 'ig_005', username: 'wahyu_ok', text: 'Informasinya sangat jelas dan lengkap, terima kasih!', publishedAt: '2026-09-01T12:00:00Z', likeCount: 15 },
  { commentId: 'ig_006', username: 'tono_surabaya', text: 'Produk sudah sesuai deskripsi. Puas!', publishedAt: '2026-09-01T13:00:00Z', likeCount: 6 },
  { commentId: 'ig_007', username: 'maya_art', text: 'Kenapa responnya lama banget ya? Sudah chat berkali-kali.', publishedAt: '2026-09-01T14:00:00Z', likeCount: 18 },
  { commentId: 'ig_008', username: 'dedi_jkt', text: 'Mantap! Rekomen ke semua teman deh.', publishedAt: '2026-09-01T15:00:00Z', likeCount: 9 },
  { commentId: 'ig_009', username: 'fitri_online', text: 'Barang datang dalam kondisi rusak, sangat kecewa.', publishedAt: '2026-09-01T16:00:00Z', likeCount: 32 },
  { commentId: 'ig_010', username: 'agus_bdg', text: 'Harga sebanding dengan kualitas. Worth it!', publishedAt: '2026-09-01T17:00:00Z', likeCount: 11 },
  { commentId: 'ig_011', username: 'lestari_solo', text: 'Kemasan sangat rapi dan aman, terima kasih sudah memerhatikan detail.', publishedAt: '2026-09-01T18:00:00Z', likeCount: 7 },
  { commentId: 'ig_012', username: 'budi_tangerang', text: 'Pelayanan kurang memuaskan, pertanyaan saya tidak dijawab.', publishedAt: '2026-09-01T19:00:00Z', likeCount: 14 },
  { commentId: 'ig_013', username: 'nina_cool', text: 'Produk sangat berkualitas dan tahan lama. Sudah pakai 3 bulan masih oke!', publishedAt: '2026-09-01T20:00:00Z', likeCount: 21 },
  { commentId: 'ig_014', username: 'hendra_mk', text: 'Biasa saja, tidak ada yang spesial.', publishedAt: '2026-09-01T21:00:00Z', likeCount: 2 },
  { commentId: 'ig_015', username: 'dian_beauty', text: 'Sangat puas! Akan beli lagi bulan depan.', publishedAt: '2026-09-01T22:00:00Z', likeCount: 19 },
];

const MOCK_COMMENTS_TIKTOK = [
  { commentId: 'tt_001', username: 'tiktoker_andi', text: 'Kontennya keren abis! Subscribe langsung!', publishedAt: '2026-09-10T08:00:00Z', likeCount: 55 },
  { commentId: 'tt_002', username: 'viewer_xyz', text: 'Informasinya berguna banget, makasih sudah share!', publishedAt: '2026-09-10T09:00:00Z', likeCount: 42 },
  { commentId: 'tt_003', username: 'skeptis_bro', text: 'Kurang setuju dengan pendapatnya, terlalu subjektif.', publishedAt: '2026-09-10T10:00:00Z', likeCount: 8 },
  { commentId: 'tt_004', username: 'nonton_mulu', text: 'Editannya bagus dan musiknya pas banget!', publishedAt: '2026-09-10T11:00:00Z', likeCount: 38 },
  { commentId: 'tt_005', username: 'pemirsa_kritis', text: 'Sumber datanya dari mana? Perlu referensi yang lebih kredibel.', publishedAt: '2026-09-10T12:00:00Z', likeCount: 16 },
  { commentId: 'tt_006', username: 'fans_setia', text: 'Selalu update dan informatif, keep it up!', publishedAt: '2026-09-10T13:00:00Z', likeCount: 29 },
  { commentId: 'tt_007', username: 'random_user1', text: 'Wkwkwk lucu banget, bikin part 2 dong!', publishedAt: '2026-09-10T14:00:00Z', likeCount: 61 },
  { commentId: 'tt_008', username: 'critic_mode', text: 'Penyampaiannya membingungkan, susah dipahami.', publishedAt: '2026-09-10T15:00:00Z', likeCount: 5 },
  { commentId: 'tt_009', username: 'positive_vibes', text: 'Ini video paling bermanfaat yang aku lihat minggu ini!', publishedAt: '2026-09-10T16:00:00Z', likeCount: 73 },
  { commentId: 'tt_010', username: 'netizen_biasa', text: 'Lumayan, tapi bisa lebih baik lagi.', publishedAt: '2026-09-10T17:00:00Z', likeCount: 4 },
];

const fetchPost = async (platform, url, postId) => {
  // Simulate network delay
  await new Promise(resolve => setTimeout(resolve, 1500));

  if (platform === 'instagram') {
    return {
      platform: 'instagram',
      postId: postId || 'mock_ig_post_001',
      author: 'mock_instagram_account',
      caption: 'Produk terbaru kami sudah tersedia! Kualitas premium dengan harga terjangkau. Dapatkan sekarang sebelum kehabisan! 🛍️ #produk #berkualitas #terjangkau',
      publishedAt: '2026-09-01T07:00:00Z',
      likeCount: 1240,
      commentCount: MOCK_COMMENTS_INSTAGRAM.length,
      thumbnailUrl: null,
      comments: MOCK_COMMENTS_INSTAGRAM,
    };
  }

  if (platform === 'tiktok') {
    return {
      platform: 'tiktok',
      postId: postId || 'mock_tt_video_001',
      author: 'mock_tiktok_creator',
      caption: 'Tips dan trik yang wajib kamu tahu! 🔥 #tips #informatif #trending',
      publishedAt: '2026-09-10T07:00:00Z',
      likeCount: 8540,
      commentCount: MOCK_COMMENTS_TIKTOK.length,
      thumbnailUrl: null,
      comments: MOCK_COMMENTS_TIKTOK,
    };
  }

  throw Object.assign(new Error(`Mock: unsupported platform ${platform}`), { code: 'UNSUPPORTED_PLATFORM' });
};

module.exports = { fetchPost };
