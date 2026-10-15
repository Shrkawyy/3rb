HELLZ by S v2.1.0 - Connection loop mitigation
- Stop automatic reconnect on server rejection: New connection from this browser.
- Do not repeatedly retry rejected Tab 2 connections.
- Require both authenticated account slots before auto-starting Tab 2; otherwise leave Tab 1 alone.
- Reconnect manually after closing competing windows/bots and confirming server policy.
- Does not bypass or guarantee server connection limits.
- Upload all files and replace Tampermonkey script to invalidate previous cache.

HELLZ — by S | الإصدار 2.0.0

التركيب:
1. ارفع محتويات هذا المجلد في جذر مشروع GitHub المرتبط بموقعك على Vercel.
   استبدل index.html وm.js وv.js وshield.js، وأضف launcher.js وbots.js وhellz-ui.js وhellz.user.js.
2. انتظر انتهاء نشر Vercel. لا تستخدم السكريبت الجديد قبل رفع الملفات الجديدة.
3. افتح Tampermonkey، عطّل نسخ Drag/HELLZ القديمة، ثم أنشئ سكريبت واحدًا والصق محتوى hellz.user.js.
4. احفظ وافتح https://3rb.io/ في تبويب جديد. تشغيل اللعبة يتم على 3rb.io، وليس دومين Vercel.
5. الاستضافة المضبوطة: https://3rbio-sigma.vercel.app/
   عند تغيير الدومين، عدّله في launcher.js وhellz.user.js و@connect في السكريبت.

التغييرات:
- الاسم المرئي HELLZ، والتوقيع by S، وauthor في Tampermonkey هو HELLZ.
- شاشة داكنة بسماوي ونحاسي، وشريط يعكس مراحل تنزيل الملفات وتهيئة النقل والتحقق.
- 100% تعني اكتمال تهيئة العميل وإرسال تحقق الاتصال الأول وفق حالة العميل؛ لا تعني أن الخلية ظهرت أو أن كل البوتات اتصلت.
- تركيب HTML بالكامل والتحقق من العناصر قبل تهيئة الماوس والعميل.
- تخزين نسخة متكاملة من موارد الإصدار لمدة خمس دقائق لتسريع الفتح التالي.
- إزالة تحميل Tippy غير المستخدم، وعدم تكرار سكريبت التحقق.
- مهلة تحقق وزر إعادة محاولة، ودعم اسم bundle الحديث في اكتشاف WASM مع إبقاء fallback الموجود.
- إبقاء سجلات الأخطاء مرئية وإصلاح قراءة النصوص داخل الإطارات ذات byteOffset.
- حفظ مفاتيح الحسابات والإعدادات القديمة داخليًا حتى لا تضيع بيانات المستخدم عند تغيير الهوية.

البوتات:
- لوحة HELLZ BOTS بها Connect وStop all وSpawn وSplit وFeed، ومتابعة الماوس/اللاعب، وAuto spawn/respawn وAuto split.
- ابدأ بواحد فقط بعد دخول سيرفر. عدد الاتصالات في الواجهة من 1 إلى 10، والقبول الفعلي يحدده السيرفر.
- لكل بوت اتصال مستقل وخرائط خلايا مستقلة؛ يتم التحقق العادي بالتتابع، دون إعادة استعمال رموز التحقق.
- لا توجد إعادة اتصال تلقائية للبوت المرفوض. فشل اتصال يوقف إضافة بقية الدفعة.
- تغيير السيرفر يوقف البوتات القديمة؛ استخدم Connect من جديد.
- مكان الظهور يختاره السيرفر؛ إرسال موقع الماوس ليس ضمانًا للظهور تحته.
- قد يرفض السيرفر اتصالات الضيوف الإضافية أو يستبدل اتصالًا موجودًا. لا يتم تجاوز حدود السيرفر.

طبيعة النقل من الملفات المرسلة:
واجهة delta-bots تعتمد على window.app.botHandler وعميل داخل bundle.js خاص بـSenpa/Delta.
لا يمكن تشغيل ذلك البروتوكول مباشرة على 3rb. تم نقل سير عمل الأوامر الأساسية إلى واجهة جديدة
مع طبقة نقل مستقلة تستخدم بروتوكول 3rb الموجود في مشروعك.
لم يتم نقل اللوحة القديمة بكامل خياراتها، ولا أدوات IP pass أو خدمات حل الكابتشا الخارجية.

التحقق المنجز:
- فحص صياغة ملفات JavaScript.
- اختبار DOM محلي باستخدام jsdom: تهيئة العميل الأصلي، ربط Mouse.canvas، وتركيب لوحة البوتات وشريط التقدم.
- اختبارات رسائل مصطنعة: handshake، إرسال التحقق، عدم اعتبار socket المفتوح جاهزًا، spawn، معرفات الخلايا، قراءة العالم، الحركة، split/feed، byteOffset، وتنظيف الاتصال.
- لم يتم إجراء اختبار اتصال حي أو ظهور البوتات على سيرفر 3rb، ولا يمكن ضمان التشغيل 100% من هذه الاختبارات.

لو فشل التشغيل:
صوّر Console ورسالة حالة البوت، مع إخفاء أي tokens أو بيانات حسابات.
لإجبار تنزيل ملفات جديدة انتظر خمس دقائق أو امسح بيانات تخزين هذا السكريبت من Tampermonkey.
