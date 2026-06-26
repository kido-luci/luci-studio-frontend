// Vietnamese UI-string catalog. Mirrors en.ts key-for-key. Short UI labels are
// drafted here; tone can be refined later. A missing key falls back to the English
// value (see useTranslations), so the site never renders blank.
export const vi: Record<string, string> = {
  // nav
  'nav.home': 'Trang chủ',
  'nav.blog': 'Blog',
  'nav.series': 'Series',
  'nav.lab': 'Lab',
  'nav.cta': 'Liên hệ',
  'nav.toggleTheme': 'Đổi giao diện',

  // footer
  'footer.portfolio': 'Portfolio',
  'footer.terms': 'Điều khoản',
  'footer.privacy': 'Bảo mật',
  'footer.cookie': 'Cài đặt Cookie',

  // read-time unit
  'readtime.unit': 'phút',

  // cookie banner
  'cookie.title': 'Cài đặt Cookie',
  'cookie.body': 'Luci Studio sử dụng bộ nhớ cục bộ cho các tính năng cần thiết như giao diện, lượt thích, đăng nhập và lịch sử trò chuyện.',
  'cookie.privacy': 'Bảo mật',
  'cookie.terms': 'Điều khoản',
  'cookie.reject': 'Từ chối tuỳ chọn',
  'cookie.accept': 'Chấp nhận tuỳ chọn',

  // blog list
  'blog.eyebrow': 'Thành Quả',
  'blog.title': 'Suy Nghĩ',
  'blog.countLabel': 'Đang hiển thị',
  'blog.searchPlaceholder': 'Tìm bài viết…',
  'blog.searchAriaLabel': 'Tìm bài viết',
  'blog.filterLabel': 'Lọc theo chủ đề',
  'blog.filterAll': 'Tất cả',
  'blog.featuredBadge': '★ Nổi bật',
  'blog.readArticle': 'Đọc bài viết',
  'blog.showAllTags': 'Xem tất cả thẻ',
  'blog.showFewerTags': 'Thu gọn thẻ',
  'blog.emptyTitle': 'Chưa có gì ở đây',
  'blog.emptySub': 'Không có bài viết nào khớp. Thử chủ đề khác.',
  'blog.clearFilters': 'Xoá bộ lọc',
  'blog.seeAll': 'Xem tất cả →',
  'blog.seriesEyebrow': 'Bộ sưu tập',
  'blog.seriesHeader': 'Series',
  'blog.prevPage': 'Trang trước',
  'blog.nextPage': 'Trang sau',

  // post detail
  'post.backToBlog': 'Trở về Blog',
  'post.likeAriaLabel': 'Thích bài này',
  'post.shareAriaLabel': 'Chia sẻ bài này',
  'post.shareText': 'Chia sẻ',
  'post.saveAriaLabel': 'Lưu để đọc sau',
  'post.enjoyedRead': 'Bạn thích bài này?',
  'post.likes': 'lượt thích',
  'post.foundHelpful': 'Bài viết có ích?',
  'post.supportWork': 'Ủng hộ tôi',
  'post.supportBody': 'Nếu bài viết này giúp ích cho bạn, hãy mời tôi một ly cà phê. Mỗi đóng góp giữ tôi viết và sáng tạo.',
  'post.supportCta': 'Ủng hộ qua PayPal',
  'post.scanToPay': 'Quét mã để thanh toán',
  'post.continueReading': 'Đọc tiếp',
  'post.morePosts': 'Bài viết khác',
  'post.viewAll': 'Xem tất cả',
  'post.commentsSortNewest': 'Mới nhất trước',
  'post.signInWithGoogle': 'Đăng nhập với Google',
  'post.signOut': 'Đăng xuất',
  'post.submitComment': 'Gửi',
  'post.addCommentPlaceholder': 'Thêm bình luận…',
  'post.addCommentAria': 'Thêm bình luận',
  'post.commentsLabel': 'Bình luận',
  'post.notFoundTitle': 'Không tìm thấy bài viết',
  'post.notFoundBody': 'Bài viết bạn đang tìm có thể đã được chuyển hoặc xoá.',
  'post.notFoundBack': 'Trở về Blog',
  'post.read': 'đọc',
  'post.loadMoreComments': 'Tải thêm bình luận',

  // series list
  'series.backToThoughts': 'Trở về Suy Nghĩ',
  'series.eyebrow': 'Bộ sưu tập',
  'series.title': 'Series',
  'series.collectionLabel': 'Bộ sưu tập',
  'series.empty': 'Chưa có series nào',

  // series detail
  'series.allSeries': 'Tất cả Series',
  'series.curatedSeries': 'Series được tuyển chọn',
  'series.curatedLabel': 'tuyển chọn',
  'series.seriesEmpty': 'Series này chưa có bài viết',

  // portfolio
  'portfolio.thePersonEyebrow': 'Con Người',
  'portfolio.myStory': 'Câu chuyện của tôi',
  'portfolio.theRecord': 'Hồ Sơ',
  'portfolio.experience': 'Kinh nghiệm',
  'portfolio.paidWork': 'Việc làm',
  'portfolio.ownBets': 'Dự án cá nhân',
  'portfolio.theStack': 'Công nghệ',
  'portfolio.skills': 'Kỹ năng',
  'portfolio.disciplines': 'Lĩnh vực',
  'portfolio.toolsAndCrafts': 'Công cụ & Kỹ xảo',
  'portfolio.enoughTalking': 'Nói đủ rồi.',
  'portfolio.emailMe': 'Gửi Email',
  'portfolio.backHome': 'Trang chủ',
  'portfolio.basedIn': 'Đặt tại',

  // lab
  'lab.releasedApps': 'Ứng dụng đã phát hành',
  'lab.publicSource': 'Mã nguồn mở',
  'lab.labDescription': 'Kho mã nguồn công khai và ứng dụng đã phát hành — của tôi và một số dự án đáng chú ý khác.',
  'lab.noRepos': 'Chưa có kho lưu trữ nào.',

  // legal pages
  'legal.eyebrow': 'Pháp lý',
  'legal.lastUpdated': 'Cập nhật lần cuối:',

  // home
  'home.letsTalk': 'Nói chuyện nào',
  'home.viewWork': 'Xem công việc',
  'home.seeArt': 'Xem nghệ thuật →',
  'home.scrollLabel': 'CUỘN',
  'home.artDescription': 'Kỷ luật thẩm mỹ nghiêm ngặt. Nơi logic kỹ thuật thô gặp gỡ hệ thống thị giác có chủ đích.',
  'home.scrollDown': 'Cuộn xuống để xem thêm',
  'home.rawOutput': 'Thành Quả',
  'home.thoughts': 'Suy Nghĩ',
  'home.openSourceApps': 'Mã nguồn mở & Ứng dụng',
  'home.lab': 'Lab',
  'home.exploreLab': 'Khám phá Lab',
  'home.readingPaths': 'Lộ trình đọc',
  'home.series': 'SERIES',
  'home.viewSeries': 'Xem series',
  'home.offClock': 'Ngoài giờ',
  'home.theArt': 'Nghệ thuật',
  'home.enoughTalking': 'Nói đủ rồi.',
  'home.sayHello': 'Xin chào',
  'home.techBlogTitle': 'TECH BLOG',
  'home.techBlogSub': 'Ghi chú về Flutter, Go & AI trên thiết bị',
  'home.digitalArtTitle': 'NGHỆ THUẬT SỐ',
  'home.digitalArtSub': 'Tác phẩm sinh thành & thủ công',
  'home.appsTitle': 'ỨNG DỤNG',
  'home.appsSub': 'Phát hành trên 5 nền tảng',
  'home.viewAllPosts': 'Xem tất cả {n} bài viết',

  // blog list — interpolated / plural (Vietnamese has no plural — one form for both)
  'blog.subOne': '{n} bài viết về kỹ thuật, kiến trúc, và nghề xây dựng phần mềm.',
  'blog.subOther': '{n} bài viết về kỹ thuật, kiến trúc, và nghề xây dựng phần mềm.',
  'blog.showing': 'Hiển thị {from}–{to} trên {total}',
  'blog.featuredSuffix': ' + nổi bật',

  // series list — interpolated
  'series.sub': '{n} series — danh sách đọc có chủ đề, theo thứ tự, nên đọc từ đầu đến cuối.',
  'series.postCountOne': '{n} bài viết',
  'series.postCountOther': '{n} bài viết',

  // legal page titles
  'legal.privacyTitle': 'Chính sách bảo mật',
  'legal.termsTitle': 'Điều khoản sử dụng',

  // portfolio CTA
  'portfolio.letsBuild': 'CÙNG XÂY DỰNG',

  // comments i18n (read by public/scripts/post-engagement-comments.js via data-*)
  'comments.noComments': 'Chưa có bình luận nào. Hãy là người đầu tiên!',
  'comments.recall': 'Thu hồi',
  'comments.reply': 'Trả lời',
  'comments.replyingTo': 'Trả lời',
  'comments.cancel': 'Huỷ',
  'comments.replySubmit': 'Trả lời',
  'comments.signInToReply': 'Đăng nhập với Google',
  'comments.signInToReplySuffix': ' để trả lời.',
  'comments.sortNewest': 'Mới nhất trước',
  'comments.sortOldest': 'Cũ nhất trước',
  'comments.loadMore': 'Tải thêm bình luận',
  'comments.loading': 'Đang tải…',
  'comments.posting': 'Đang gửi…',
  'comments.submitBtn': 'Gửi',
  'comments.recallConfirmMsg': 'Thu hồi bình luận này? Không thể hoàn tác.',
  'comments.recallConfirmOk': 'Thu hồi',
  'comments.recallConfirmCancel': 'Huỷ',
  'comments.signOutConfirmMsg': 'Đăng xuất khỏi tài khoản của bạn?',
  'comments.signOutConfirmOk': 'Đăng xuất',
  'comments.signOutConfirmCancel': 'Huỷ',
  'comments.messageRecalled': 'Tin nhắn đã thu hồi',
  'comments.failedLoad': 'Không thể tải bình luận.',
  'comments.timeJustNow': 'vừa xong',
  'comments.timeMinute': '{n} phút trước',
  'comments.timeMinutes': '{n} phút trước',
  'comments.timeHour': '{n} giờ trước',
  'comments.timeHours': '{n} giờ trước',
  'comments.timeDay': '{n} ngày trước',
  'comments.timeDays': '{n} ngày trước',

  // emoji picker
  'emoji.searchPlaceholder': '🔍  Tìm emoji…',
  'emoji.catSmileys': 'Mặt cười',
  'emoji.catGestures': 'Cử chỉ',
  'emoji.catHearts': 'Trái tim',
  'emoji.catAnimals': 'Động vật',
  'emoji.catFood': 'Đồ ăn',
  'emoji.catObjects': 'Đồ vật',
};
