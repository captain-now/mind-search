/* Prayer space interface. Names entered on seats are kept in their original form. */
(() => {
  const language = window.mindSearchLanguage;
  const strings = {
    '기도 공간': ['Prayer spaces', '祈祷空间', '祈りの空間'],
    '기도 공간 선택': ['Choose a prayer space', '选择祈祷空间', '祈りの空間を選ぶ'],
    '기도동참으로 돌아가기': ['Back to the prayer entrance', '返回祈祷入口', '祈りの入口に戻る'],
    '기도 공간으로 돌아가기': ['Back to prayer spaces', '返回祈祷空间', '祈りの空間に戻る'],
    '기도공간으로 돌아가기': ['Back to prayer spaces', '返回祈祷空间', '祈りの空間に戻る'],
    '공간 선택으로 돌아가기': ['Back to space selection', '返回空间选择', '空間の選択に戻る'],
    '전각 선택으로 돌아가기': ['Back to temple halls', '返回殿堂列表', 'お堂の一覧に戻る'],
    '각 전각으로 돌아가기': ['Back to temple halls', '返回殿堂列表', 'お堂の一覧に戻る'],
    '이 전각은 준비 중이에요.': ['This hall is being prepared.', '此殿堂正在准备中。', 'このお堂は準備中です。'],
    '이 공간은 준비 중이에요.': ['This space is being prepared.', '此空间正在准备中。', 'この空間は準備中です。'],
    'NOW정사': ['NOW Buddhist Temple', 'NOW 佛寺', 'NOW 仏教寺院'],
    'NOW성당': ['NOW Catholic Cathedral', 'NOW 天主教堂', 'NOW カトリック聖堂'],
    'NOW교회': ['NOW Church', 'NOW 基督教堂', 'NOW 教会'],
    'NOW정사 새 창으로 열기': ['Open NOW Buddhist Temple in a new tab', '在新标签页打开 NOW 佛寺', 'NOW 仏教寺院を新しいタブで開く'],
    'NOW성당 새 창으로 열기': ['Open NOW Catholic Cathedral in a new tab', '在新标签页打开 NOW 天主教堂', 'NOW カトリック聖堂を新しいタブで開く'],
    'NOW교회 새 창으로 열기': ['Open NOW Church in a new tab', '在新标签页打开 NOW 基督教堂', 'NOW 教会を新しいタブで開く'],
    '전각': ['Temple halls', '寺院殿堂', '寺院のお堂'],
    '전각 선택': ['Choose a temple hall', '选择殿堂', 'お堂を選ぶ'],
    '대적광전': ['Daejeokgwangjeon (Vairocana Hall)', '大寂光殿', '大寂光殿'],
    '대웅전': ['Daeungjeon (Main Buddha Hall)', '大雄殿', '大雄殿'],
    '무량수전': ['Muryangsujeon (Amitābha Hall)', '无量寿殿', '無量寿殿'],
    '관음전': ['Gwaneumjeon (Avalokiteśvara Hall)', '观音殿', '観音殿'],
    '지장전': ['Jijangjeon (Kṣitigarbha Hall)', '地藏殿', '地蔵殿'],
    '삼성각': ['Samseonggak (Three Saints Shrine)', '三星阁', '三星閣'],
    '산신': ['Mountain Spirit', '山神', '山神'],
    '칠성': ['Seven Stars', '七星', '七星'],
    '독성': ['Solitary Sage', '独圣', '独聖'],
    '교회': ['Church', '基督教堂', '教会'],
    '성당': ['Catholic Cathedral', '天主教堂', 'カトリック聖堂'],
    '전경': ['Interior views', '内部景观', '堂内の風景'],
    '일시정지': ['Pause', '暂停', '一時停止'],
    '재생': ['Play', '播放', '再生'],
    'NOW 마음챙김 · 정근': ['NOW Mindfulness · Prayer audio', 'NOW 正念 · 祈祷音频', 'NOW マインドフルネス・祈りの音声'],
    '좌석': ['Seat', '座位', '座席'],
    '의자': ['Chair', '椅子', '椅子'],
    '좌복': ['Meditation cushion', '坐垫', '座布団'],
    '수행 공간': ['Practice area', '修行区', '修行スペース'],
    '좌복 이름 입력': ['Enter a name for the cushion', '填写坐垫上的姓名', '座布団に表示する名前を入力'],
    '출생연도': ['Year of birth', '出生年份', '生まれ年'],
    '년생': ['Year of birth', '年出生', '年生まれ'],
    '이름': ['Name', '姓名', '名前'],
    '대장금': ['Enter a name', '请输入姓名', '名前を入力'],
    '닫기': ['Close', '关闭', '閉じる'],
    '확인': ['Confirm', '确认', '確定'],
    '복위': ['Prayer sponsor', '祈福人', '祈願者'],
    '영가': ['Name of the departed', '亡者姓名', '故人の名前'],
    '홍길동 복위': ['Sponsor’s name', '请输入祈福人姓名', '祈願者の名前を入力'],
    '아버지 영가': ['Name of the departed', '请输入亡者姓名', '故人の名前を入力'],
    '아멘': ['Amen', '阿们', 'アーメン'],
    '아베마리아': ['Ave Maria', '万福玛利亚', 'アヴェ・マリア'],
    '옴남': ['Om Nam', '嗡南', 'オン・ナン'],
    '석가모니불': ['Śākyamuni Buddha', '释迦牟尼佛', '釈迦牟尼仏'],
    '나무아미타불': ['Homage to Amitābha Buddha', '南无阿弥陀佛', '南無阿弥陀仏'],
    '관세음보살': ['Avalokiteśvara Bodhisattva', '观世音菩萨', '観世音菩薩'],
    '옴마니반메홈': ['Om Mani Padme Hum', '嗡嘛呢叭咪吽', 'オン・マニ・ペメ・フム'],
    '지장보살': ['Kṣitigarbha Bodhisattva', '地藏菩萨', '地蔵菩薩'],
    '산왕대신': ['Mountain King Spirit', '山王大神', '山王大神'],
    '칠원성군': ['Lords of the Seven Stars', '七元星君', '七元星君'],
    '나반존자': ['Venerable Naban', '那畔尊者', '那畔尊者'],
    '음성을 재생할 수 없어요. 다시 눌러 주세요.': ['Audio could not play. Please try again.', '无法播放音频，请再试一次。', '音声を再生できませんでした。もう一度お試しください。'],
    '좌석에 반영 중…': ['Updating the seat…', '正在更新座位…', '座席に反映しています…'],
    '좌석에 반영하지 못했습니다. 기도 공간 창이 열려 있는지 확인해 주세요.': ['Could not update the seat. Make sure the prayer space is still open.', '无法更新座位。请确认祈祷空间的窗口仍然打开。', '座席に反映できませんでした。祈りの空間が開いているか確認してください。'],
    '선택한 좌석을 불러오는 중…': ['Loading the selected seat…', '正在载入所选座位…', '選んだ座席を読み込んでいます…'],
    '기도 공간에서 좌복이나 의자를 눌러 열어 주세요.': ['Open this form by selecting a cushion or chair in the prayer space.', '请在祈祷空间选择坐垫或椅子以打开表单。', '祈りの空間で座布団または椅子を選んで開いてください。'],
    '좌석에 반영했습니다. 이 창을 닫아 돌아갈 수 있습니다.': ['Seat updated. Close this window to return.', '座位已更新。关闭此窗口即可返回。', '座席に反映しました。このウィンドウを閉じると戻れます。'],
    '기도 공간에서 좌복이나 의자를 다시 눌러 주세요.': ['Select the cushion or chair again in the prayer space.', '请在祈祷空间重新选择坐垫或椅子。', '祈りの空間で座布団または椅子をもう一度選んでください。'],
    '이름 입력 화면을 새 창으로 열기': ['Open the name form in a new tab', '在新标签页打开姓名表单', '名前の入力フォームを新しいタブで開く'],
    '아침빛이 드는 중앙 통로와 제단': ['Morning light across the central aisle and altar', '晨光照亮中央过道和祭坛', '朝の光が差し込む中央通路と祭壇'],
    '십자가와 흰 돌 제단': ['Cross and white stone altar', '十字架与白石祭坛', '十字架と白い石の祭壇'],
    '보석빛 스테인드글라스 장미창': ['Jewel-toned stained-glass rose window', '宝石色的彩绘玻璃玫瑰窗', '宝石色のステンドグラスのバラ窓'],
    '스테인드글라스 빛이 비치는 측랑': ['Side aisle lit by stained glass', '彩绘玻璃透光的侧廊', 'ステンドグラスの光が差す側廊'],
    '성모상과 촛불이 있는 소성당': ['Chapel with a statue of Mary and candles', '有圣母像和烛光的小礼拜堂', '聖母像とろうそくのある小聖堂'],
    '측면에서 바라본 제단': ['Side view of the altar', '从侧面望向祭坛', '横から見た祭壇'],
    '고딕 천장 아치와 기둥': ['Gothic ceiling arches and columns', '哥特式穹顶拱券与立柱', 'ゴシック様式の天井アーチと柱'],
    '파이프오르간과 성가대석': ['Pipe organ and choir loft', '管风琴与唱诗班席', 'パイプオルガンと聖歌隊席'],
    '노을빛이 비치는 중앙 통로': ['Central aisle in the sunset light', '夕照中的中央过道', '夕日に照らされた中央通路'],
    '촛불로 밝혀진 저녁 제단': ['Altar lit by candles in the evening', '烛光照亮的夜晚祭坛', 'ろうそくに照らされた夕べの祭壇'],
    '아침빛이 드는 교회 중앙 통로': ['Morning light in the church aisle', '晨光洒进教堂中央过道', '朝の光が差し込む教会の中央通路'],
    '나무 십자가와 강단': ['Wooden cross and pulpit', '木制十字架和讲坛', '木の十字架と説教壇'],
    '창가에서 바라본 예배당': ['View of the sanctuary from a window', '从窗边望向礼拜堂', '窓辺から見た礼拝堂'],
    '강단에 펼쳐진 성경': ['Open Bible on the pulpit', '讲坛上摊开的圣经', '説教壇の上で開かれた聖書'],
    '피아노가 있는 예배당 앞자리': ['Front of the sanctuary with a piano', '礼拜堂前方的钢琴', 'ピアノのある礼拝堂の前方'],
    '예배당 천장과 나무 들보': ['Sanctuary ceiling and wooden beams', '礼拜堂的天花板和木梁', '礼拝堂の天井と木の梁'],
    '강단에서 바라본 예배당 좌석': ['Sanctuary seating seen from the pulpit', '从讲坛望向礼拜堂座席', '説教壇から見た礼拝堂の座席'],
    '빗방울 맺힌 창가의 성경': ['Bible beside a rain-speckled window', '雨滴点缀的窗旁放着圣经', '雨粒のついた窓辺の聖書'],
    '노을이 비치는 예배당 통로': ['Sanctuary aisle in the sunset light', '夕照中的礼拜堂过道', '夕日に照らされた礼拝堂の通路'],
    '저녁빛 아래의 십자가와 강단': ['Cross and pulpit in the evening light', '暮色中的十字架与讲坛', '夕暮れの光に包まれた十字架と説教壇'],
    '금빛 비로자나불과 푸른 단청이 보이는 대적광전': ['Vairocana Hall with a golden Buddha and blue-green painted woodwork', '大寂光殿内的金色毗卢遮那佛与青绿色彩绘', '金色の毘盧遮那仏と青緑の彩色が見える大寂光殿'],
    '단청과 연등 사이로 금빛 석가모니불이 보이는 대웅전': ['Main Buddha Hall with golden Śākyamuni, painted beams, and lotus lanterns', '大雄殿的彩绘与莲灯间可见金色释迦牟尼佛', '彩色と蓮の灯籠の間に金色の釈迦牟尼仏が見える大雄殿'],
    '아미타불과 따뜻한 목조 기둥이 보이는 무량수전': ['Amitābha Hall with the Buddha and warm-toned wooden pillars', '无量寿殿的阿弥陀佛与暖色木柱', '阿弥陀仏と温かみのある木の柱が見える無量寿殿'],
    '흰 옷을 입은 관세음보살이 보이는 관음전': ['Avalokiteśvara Hall with the bodhisattva in white', '观音殿中的白衣观世音菩萨', '白衣の観世音菩薩が見える観音殿'],
    '보주와 석장을 지닌 지장보살이 보이는 지장전': ['Kṣitigarbha Hall with the bodhisattva holding a jewel and staff', '地藏殿中手持宝珠与锡杖的地藏菩萨', '宝珠と錫杖を手にした地蔵菩薩が見える地蔵殿'],
    '왼쪽부터 산신·칠성·독성이 모셔진 삼성각': ['Three Saints Shrine with the Mountain Spirit, Seven Stars, and Solitary Sage from left to right', '三星阁内从左至右供奉山神、七星和独圣', '左から山神・七星・独聖を祀る三星閣'],
  };

  const code = language.read();
  const index = ['en', 'zh', 'ja'].indexOf(code);
  const choose = (ko, en, zh, ja) => index === -1 ? ko : [en, zh, ja][index];
  const text = value => strings[value]?.[index] ?? value;
  const title = name => text(name) + ' | NOW Mind Search';
  document.documentElement.lang = code;
  window.prayerLanguage = { code, text, choose, title };

  window.addEventListener('DOMContentLoaded', () => {
    if (index === -1) return;
    const suffix = ' | NOW Mind Search';
    if (document.title.endsWith(suffix)) document.title = title(document.title.slice(0, -suffix.length));
    const walker = document.createTreeWalker(document.body, NodeFilter.SHOW_TEXT);
    while (walker.nextNode()) {
      const node = walker.currentNode;
      if (node.parentElement.closest('script, style, .seat-name-label')) continue;
      const translated = text(node.nodeValue.trim());
      if (translated !== node.nodeValue.trim()) node.nodeValue = node.nodeValue.replace(node.nodeValue.trim(), translated);
    }
    for (const element of document.querySelectorAll('[aria-label], [alt], [placeholder]')) {
      if (element.matches('.paired-row > button')) continue;
      for (const attribute of ['aria-label', 'alt', 'placeholder']) {
        if (element.hasAttribute(attribute)) element.setAttribute(attribute, text(element.getAttribute(attribute)));
      }
    }
  });
})();
