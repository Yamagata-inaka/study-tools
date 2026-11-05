window.PX = (window.PX || []).concat([
{ id:"of-1", year:"探索", no:1, topic:"二分探索",
  stem:`<p>次のプログラム中の［ a ］と［ b ］に入れる正しい答えの組合せを，解答群の中から選べ。ここで，配列の要素番号は 1 から始まる。</p>
<p>関数 binarySearch は，昇順に整列された整数型の配列 data と整数 target を受け取り，data の中に target と等しい要素があればその要素番号を，なければ －1 を返す。</p>`,
  code:[
".○整数型: binarySearch(整数型の配列: data, 整数型: target)",
"+   整数型: lo ← 1",
"+   整数型: hi ← dataの要素数",
".   整数型: mid",
"+   while (lo ≦ hi)",
"+      mid ← (lo ＋ hi) ÷ 2 の商",
"+      if (data[mid] ＝ target)",
".         return mid",
"!      elseif (data[mid] ＜ target)",
"!         [[a]]",
".      else",
"!         [[b]]",
".      endif",
".   endwhile",
".   return －1"],
  fill:{a:"lo ← mid ＋ 1",b:"hi ← mid － 1"},
  choices:{cols:["a","b"],rows:[["ア","lo ← mid ＋ 1","hi ← mid － 1"],["イ","lo ← mid","hi ← mid"],["ウ","hi ← mid － 1","lo ← mid ＋ 1"],["エ","lo ← mid － 1","hi ← mid ＋ 1"]]},
  ans:"ア",
  steps:[
  {t:"設問と選択肢を先に見る",h:`<p>探す範囲 [lo, hi] の縮め方を選びます。二分探索は試験で頻出の<b>型</b>なので、形ごと覚えておく価値があります。</p>`},
  {t:"選択肢どうしの違いを見る",h:`<ul><li>どちらの端を動かすか（ア・イ と ウ）</li><li>mid を含めるか（mid か mid±1 か）</li><li>広げる方向に動かしていないか（エ）</li></ul>`},
  {t:"目的を1行でつかむ",h:`<p class="mk">真ん中を見て、target より小さければ右半分、大きければ左半分に絞る。</p>`},
  {t:"空欄の周りだけ読む",map:true,h:`<p>a は data[mid] ＜ target のとき。target は mid より右にあるので、<b>左端 lo を mid の右隣へ</b>動かします。mid 自体は target でないと分かっているので、範囲に残す必要はありません。b はその逆です。</p>`},
  {t:"小さい例でトレース",h:`<p>{1, 3, 5, 7} で 6（ない値）を探し、止まるかを確かめます。</p>
<div class="tw"><table class="tr"><tr><th>lo</th><th>hi</th><th>mid</th><th>data[mid]</th><th>アの処理</th></tr>
<tr><td>1</td><td>4</td><td>2</td><td>3</td><td>3 ＜ 6 → lo ← 3</td></tr>
<tr><td>3</td><td>4</td><td>3</td><td>5</td><td>5 ＜ 6 → lo ← 4</td></tr>
<tr><td>4</td><td>4</td><td>4</td><td>7</td><td>7 ＞ 6 → hi ← 3</td></tr>
<tr class="em"><td>4</td><td>3</td><td colspan="3">lo ＞ hi で終了 → －1</td></tr></table></div>
<p>イ（lo ← mid）だと、lo ＝ 3、hi ＝ 4 で mid ＝ 3 となり、lo ← 3 のまま変わらず<b>無限ループ</b>になります。</p>`},
  {t:"選択肢を消す",h:`<ul class="elim">
<li class="o"><b>ア</b><span>正解。</span></li>
<li class="x"><b>イ</b><span>範囲が縮まらず止まらないことがある。</span></li>
<li class="x"><b>ウ</b><span>target がある側を捨ててしまう。</span></li>
<li class="x"><b>エ</b><span>範囲を広げてしまう。</span></li></ul>`}],
  sum:{type:"二分探索",label:"if の枝 ＝「target のある半分に絞る」",tip:"範囲を縮める処理は、必ず縮むか（無限ループにならないか）を「lo と hi が隣り合った状態」で確かめる。"}
},
{ id:"of-2", year:"探索", no:2, topic:"二分探索の回数",
  stem:`<p>次の記述中の［　　］に入れる正しい答えを，解答群の中から選べ。ここで，配列の要素番号は 1 から始まる。</p>
<p>探索の問題 1 の関数 binarySearch に，要素数 15 の配列 data ＝ {2, 4, 6, 8, 10, 12, 14, 16, 18, 20, 22, 24, 26, 28, 30} と target ＝ 22 を与えたとき，while の繰返し処理は［　　］回実行される（return mid によって繰返しを抜けた回も含める）。</p>`,
  code:[
".○整数型: binarySearch(整数型の配列: data, 整数型: target)",
"+   整数型: lo ← 1",
"+   整数型: hi ← dataの要素数",
".   整数型: mid",
"!   while (lo ≦ hi)",
"!      mid ← (lo ＋ hi) ÷ 2 の商",
"!      if (data[mid] ＝ target)",
".         return mid",
"+      elseif (data[mid] ＜ target)",
"+         lo ← mid ＋ 1",
".      else",
"+         hi ← mid － 1",
".      endif",
".   endwhile",
".   return －1"],
  choices:{rows:[["ア","1"],["イ","2"],["ウ","3"],["エ","4"],["オ","5"]]},
  ans:"エ",
  steps:[
  {t:"設問と選択肢を先に見る",h:`<p>while の実行回数（＝ mid を見た回数）を数えます。見つかった周も1回に数えます。</p>`},
  {t:"選択肢どうしの違いを見る",h:`<p>15 要素の二分探索は最大 4 回で終わります（15 ＝ 2<sup>4</sup>－1）。答えは 1〜4 のどれかです。</p>`},
  {t:"目的を1行でつかむ",h:`<p class="mk">data[i] ＝ 2i なので、22 は 11 番目。lo, hi, mid の3つを表にして追う。</p><p>値と番号の関係が単純なときは、<b>値ではなく番号で考える</b>と速いです。target ＝ 22 は「11 番を探す」と同じです。</p>`},
  {t:"空欄の周りだけ読む",map:true,h:`<p>lo, hi, mid の3列の表だけで済みます。</p>`},
  {t:"小さい例でトレース",h:`<div class="tw"><table class="tr"><tr><th>回</th><th>lo</th><th>hi</th><th>mid</th><th>data[mid]</th><th>判定</th></tr>
<tr><td>1</td><td>1</td><td>15</td><td>8</td><td>16</td><td>16 ＜ 22 → lo ← 9</td></tr>
<tr><td>2</td><td>9</td><td>15</td><td>12</td><td>24</td><td>24 ＞ 22 → hi ← 11</td></tr>
<tr><td>3</td><td>9</td><td>11</td><td>10</td><td>20</td><td>20 ＜ 22 → lo ← 11</td></tr>
<tr class="em"><td>4</td><td>11</td><td>11</td><td>11</td><td>22</td><td>一致 → return 11</td></tr></table></div>`},
  {t:"選択肢を消す",h:`<ul class="elim">
<li class="o"><b>エ</b><span>正解。</span></li>
<li class="x"><b>ウ</b><span>最後の一致した周を数えていない。</span></li>
<li class="x"><b>オ</b><span>15 要素なら 5 回にはならない。</span></li>
<li class="x"><b>ア・イ</b><span>途中で見つかったと誤解している。</span></li></ul>`}],
  sum:{type:"二分探索（回数）",label:"1回 ＝「範囲を半分にする」",tip:"二分探索の最大回数は、要素数を 2 で割っていって 1 未満になるまでの回数。lo・hi・mid の3列の表で追う。"}
},
{ id:"of-3", year:"探索", no:3, topic:"番兵法",
  stem:`<p>次のプログラム中の［　　］に入れる正しい答えを，解答群の中から選べ。ここで，配列の要素番号は 1 から始まる。</p>
<p>関数 search は，整数型の配列 data と整数 target を受け取り，data[1] 〜 data[n] の中で target と等しい最初の要素の要素番号を返す。見つからなければ －1 を返す。data の要素数は n ＋ 1 であり，data[n ＋ 1] は探索のための作業用の領域（番兵）として使う。</p>`,
  code:[
".○整数型: search(整数型の配列: data, 整数型: n, 整数型: target)",
".   整数型: i",
"+   data[n ＋ 1] ← target",
"+   i ← 1",
"+   while (data[i] ≠ target)",
"+      i ← i ＋ 1",
".   endwhile",
"!   if ([[]])",
"+      return －1",
".   else",
".      return i",
".   endif"],
  fill:{"":"i ＝ n ＋ 1"},
  choices:{rows:[["ア","i ＝ n ＋ 1"],["イ","i ＝ n"],["ウ","i ＞ n ＋ 1"],["エ","data[i] ≠ target"]]},
  ans:"ア",
  steps:[
  {t:"設問と選択肢を先に見る",h:`<p>while を抜けた後、<b>見つかったのか、番兵に当たっただけなのか</b>を区別する条件を選びます。</p>`},
  {t:"選択肢どうしの違いを見る",h:`<p>i ＝ n＋1、i ＝ n、i ＞ n＋1、data[i] ≠ target。while を抜けた時点で必ず data[i] ＝ target なので、<span class="mk">エは常に偽</span>です。</p>`},
  {t:"目的を1行でつかむ",h:`<p class="mk">末尾に target を置いておけば、while は必ず止まる。止まった場所が末尾なら「本当は無かった」。</p><p>番兵のおかげで、while の条件に「i ≦ n」を書かなくて済みます。</p>`},
  {t:"空欄の周りだけ読む",map:true,h:`<p>i は 1 から1ずつ増え、遅くとも n＋1（番兵）で止まります。n＋1 より大きくなることはないので、ウも常に偽です。</p>`},
  {t:"小さい例でトレース",h:`<p>data ＝ {5, 8, 3, _}（n ＝ 3）で比べます。</p>
<div class="tw"><table class="tr"><tr><th>target</th><th>止まった i</th><th>ア（i ＝ 4）</th><th>イ（i ＝ 3）</th></tr>
<tr><td>8</td><td>2</td><td>偽 → 2 ○</td><td>偽 → 2</td></tr>
<tr><td>3</td><td>3</td><td>偽 → 3 ○</td><td>真 → －1 ×</td></tr>
<tr class="em"><td>9</td><td>4（番兵）</td><td>真 → －1 ○</td><td>偽 → 4 ×</td></tr></table></div>`},
  {t:"選択肢を消す",h:`<ul class="elim">
<li class="o"><b>ア</b><span>正解。</span></li>
<li class="x"><b>イ</b><span>最後の要素で見つかった場合を「無い」と判定する。</span></li>
<li class="x"><b>ウ</b><span>i は n＋1 を超えないので常に偽。</span></li>
<li class="x"><b>エ</b><span>while を抜けた時点で常に偽。</span></li></ul>`}],
  sum:{type:"線形探索（番兵法）",label:"番兵 ＝「必ず見つかる目印」",tip:"ループを抜けた直後に「何が成り立っているか」を書き出すと、常に真・常に偽の選択肢を消せる。"}
},
{ id:"of-4", year:"探索", no:4, topic:"整列済み行列の探索",
  stem:`<p>次のプログラム中の［ a ］と［ b ］に入れる正しい答えの組合せを，解答群の中から選べ。ここで，配列の要素番号は 1 から始まる。</p>
<p>関数 find は，整数型の二次元配列 m と整数 t を受け取り，m の中に t と等しい要素があれば true を，なければ false を返す。m の各行は左から右へ昇順に，各列は上から下へ昇順に並んでいる。探索は右上の要素から始める。</p>
<div class="fig"><table><tr><td>1</td><td>4</td><td>7</td></tr><tr><td>2</td><td>5</td><td>8</td></tr><tr><td>3</td><td>6</td><td>9</td></tr></table><div class="cap">m の例</div></div>`,
  code:[
".○論理型: find(整数型の二次元配列: m, 整数型: t)",
"+   整数型: r ← 1",
"+   整数型: c ← mの列数",
"+   while ((r ≦ mの行数) and (c ≧ 1))",
"+      if (m[r, c] ＝ t)",
".         return true",
"!      elseif (m[r, c] ＞ t)",
"!         [[a]]",
".      else",
"!         [[b]]",
".      endif",
".   endwhile",
".   return false"],
  fill:{a:"c ← c － 1",b:"r ← r ＋ 1"},
  choices:{cols:["a","b"],rows:[["ア","c ← c － 1","r ← r ＋ 1"],["イ","r ← r ＋ 1","c ← c － 1"],["ウ","c ← c ＋ 1","r ← r － 1"],["エ","r ← r － 1","c ← c ＋ 1"]]},
  ans:"ア",
  steps:[
  {t:"設問と選択肢を先に見る",h:`<p>今いるマスの値が t より大きいとき（a）と小さいとき（b）に、<b>どちらへ動くか</b>を選びます。</p>`},
  {t:"選択肢どうしの違いを見る",h:`<p>動く方向は左（c－1）・下（r＋1）・右・上です。while の条件（r ≦ 行数、c ≧ 1）から、<span class="mk">動くのは「下」と「左」だけ</span>だと読み取れます。ウ・エは消えます。</p>`},
  {t:"目的を1行でつかむ",h:`<p class="mk">右上から始めて、大きすぎたら左へ、小さすぎたら下へ。</p><p>右上のマスは「その行で最大、その列で最小」です。</p>`},
  {t:"空欄の周りだけ読む",map:true,h:`<ul><li>m[r, c] ＞ t：この<b>列</b>の下はもっと大きいので、この列には t はない → 左へ（c－1）</li><li>m[r, c] ＜ t：この<b>行</b>の左はもっと小さいので、この行には t はない → 下へ（r＋1）</li></ul>`},
  {t:"小さい例でトレース",h:`<p>例の m で t ＝ 5 を探します。</p>
<div class="tw"><table class="tr"><tr><th>r</th><th>c</th><th>m[r,c]</th><th>アの動き</th></tr>
<tr><td>1</td><td>3</td><td>7</td><td>7 ＞ 5 → 左</td></tr>
<tr><td>1</td><td>2</td><td>4</td><td>4 ＜ 5 → 下</td></tr>
<tr class="em"><td>2</td><td>2</td><td>5</td><td>一致 → true</td></tr></table></div>
<p>イだと 7 ＞ 5 で下へ行き、8, 9 と大きい方へ進んで見つかりません。</p>`},
  {t:"選択肢を消す",h:`<ul class="elim">
<li class="o"><b>ア</b><span>正解。</span></li>
<li class="x"><b>イ</b><span>大きすぎるのにさらに大きい方へ進む。</span></li>
<li class="x"><b>ウ・エ</b><span>while の条件から、右や上には動かない設計。</span></li></ul>`}],
  sum:{type:"二次元の探索",label:"右上 ＝「行の最大・列の最小」",tip:"ループの継続条件は、変数がどちらへ動く設計かを教えてくれる（r ≦ 行数 なら r は増える方向）。"}
},
{ id:"of-5", year:"探索", no:5, topic:"ハッシュ（線形探査）",
  stem:`<p>次の記述中の［　　］に入れる正しい答えを，解答群の中から選べ。ここで，配列の要素番号は 1 から始まる。</p>
<p>手続 insert は，正の整数 v を大域の整数型の配列 table（要素数 7）に格納する。格納位置は (v mod 7) ＋ 1 番目とし，そこが使用中（－1 以外）なら，空き（－1）が見つかるまで次の要素番号を調べる。最後の要素の次は先頭に戻る。手続 test を実行した直後の table の内容は［　　］である。</p>`,
  code:[
".大域: 整数型の配列: table",
".",
".○insert(整数型: v)",
"+   整数型: i ← (v mod 7) ＋ 1",
"+   while (table[i] ≠ －1)",
"!      i ← (i mod 7) ＋ 1",
".   endwhile",
"+   table[i] ← v",
".",
"!○test()",
"!   table ← {7個の －1}",
"!   insert(10)",
"!   insert(17)",
"!   insert(24)",
"!   insert(3)"],
  choices:{rows:[["ア","{3, －1, －1, 10, 17, 24, －1}"],["イ","{－1, －1, －1, 10, 17, 24, 3}"],["ウ","{－1, －1, 10, 17, 24, 3, －1}"],["エ","{－1, －1, －1, 3, 10, 17, 24}"],["オ","{－1, －1, －1, 24, 17, 10, 3}"]]},
  ans:"イ",
  steps:[
  {t:"設問と選択肢を先に見る",h:`<p>4 回の insert の後の配列を答えます。1つ入れるたびに選択肢を消していきます。</p>`},
  {t:"選択肢どうしの違いを見る",h:`<p>各値の入る位置が違います。<span class="mk">10, 17, 24, 3 はすべて mod 7 が 3</span>なので、全部が同じ場所（4番）を最初に狙います。衝突が続くのがこの問題の特徴です。</p>`},
  {t:"目的を1行でつかむ",h:`<p class="mk">狙った場所が埋まっていたら、1つ右へずれる（末尾の次は先頭）。</p><p>i ← (i mod 7) ＋ 1 は「i ＋ 1、ただし 7 の次は 1」という意味です。</p>`},
  {t:"空欄の周りだけ読む",map:true,h:`<p>(v mod 7) ＋ 1 の「＋1」を忘れないこと。10 mod 7 ＝ 3 なので、狙うのは 4 番目です。</p>`},
  {t:"小さい例でトレース",h:`<div class="tw"><table class="tr"><tr><th>insert</th><th>最初の位置</th><th>調べた位置</th><th>格納</th><th>残る選択肢</th></tr>
<tr><td>10</td><td>4</td><td>4</td><td>4</td><td>ア・イ（10 が4番の選択肢）</td></tr>
<tr><td>17</td><td>4</td><td>4 → 5</td><td>5</td><td>ア・イ</td></tr>
<tr><td>24</td><td>4</td><td>4 → 5 → 6</td><td>6</td><td>ア・イ</td></tr>
<tr class="em"><td>3</td><td>4</td><td>4 → 5 → 6 → 7</td><td>7</td><td>イ</td></tr></table></div>
<p>3 は最後に 7 番に入ります。もし 7 番も埋まっていたら、i ← (7 mod 7) ＋ 1 ＝ 1 で先頭に戻ります（アはその形）。</p>`},
  {t:"選択肢を消す",h:`<ul class="elim">
<li class="x"><b>ア</b><span>7 番が空いているのに先頭に戻っている。</span></li>
<li class="o"><b>イ</b><span>正解。</span></li>
<li class="x"><b>ウ</b><span>「＋1」を忘れて 3 番から入れた形。</span></li>
<li class="x"><b>エ</b><span>3 が 4 番に入っている（先に入れた 10 を押し出すことはない）。</span></li>
<li class="x"><b>オ</b><span>後から来た値が手前に入っている（逆）。</span></li></ul>`}],
  sum:{type:"ハッシュ（オープンアドレス法）",label:"while ＝「空きまで右へずれる（循環）」",tip:"(i mod n) ＋ 1 は「1〜n を循環する次の番号」の定番の書き方。配列が 1 始まりなので ＋1 が付く。"}
},
{ id:"of-6", year:"探索", no:6, topic:"挿入位置の探索",
  stem:`<p>次の記述中の［　　］に入れる正しい答えを，解答群の中から選べ。ここで，配列の要素番号は 1 から始まる。</p>
<p>関数 lowerBound は，昇順に整列された整数型の配列 data と整数 t を受け取り，整数を返す。data が {1, 3, 3, 3, 7, 9} のとき，lowerBound(data, 3) の戻り値は［　　］である。</p>`,
  code:[
".○整数型: lowerBound(整数型の配列: data, 整数型: t)",
"+   整数型: lo ← 1",
"+   整数型: hi ← dataの要素数 ＋ 1",
".   整数型: mid",
"+   while (lo ＜ hi)",
"+      mid ← (lo ＋ hi) ÷ 2 の商",
"!      if (data[mid] ＜ t)",
"!         lo ← mid ＋ 1",
".      else",
"!         hi ← mid",
".      endif",
".   endwhile",
".   return lo"],
  choices:{rows:[["ア","1"],["イ","2"],["ウ","3"],["エ","4"],["オ","5"]]},
  ans:"イ",
  steps:[
  {t:"設問と選択肢を先に見る",h:`<p>関数の目的が書かれていない、戻り値を答える問題です。二分探索に似ていますが、<b>一致しても止まらない</b>点が違います。</p>`},
  {t:"選択肢どうしの違いを見る",h:`<p>3 は 2, 3, 4 番目にあります。<span class="mk">最初の 3（2）か、最後の 3（4）か、真ん中（3）か</span>が分かれ目です。</p>`},
  {t:"目的を1行でつかむ",h:`<p class="mk">t 以上の値が最初に現れる位置を探す。</p><p>data[mid] ＜ t なら答えは mid より右（lo ← mid＋1）。そうでなければ mid も答えの候補なので、mid を残したまま右端を縮めます（hi ← mid）。</p>`},
  {t:"空欄の周りだけ読む",map:true,h:`<p>hi ← mid は mid を候補から外していません。「t 以上で一番左」を探すので、t と等しい mid を見つけても、まだ左に同じ値があるかもしれないからです。</p>`},
  {t:"小さい例でトレース",h:`<div class="tw"><table class="tr"><tr><th>lo</th><th>hi</th><th>mid</th><th>data[mid]</th><th>処理</th></tr>
<tr><td>1</td><td>7</td><td>4</td><td>3</td><td>3 ＜ 3 偽 → hi ← 4</td></tr>
<tr><td>1</td><td>4</td><td>2</td><td>3</td><td>偽 → hi ← 2</td></tr>
<tr><td>1</td><td>2</td><td>1</td><td>1</td><td>1 ＜ 3 真 → lo ← 2</td></tr>
<tr class="em"><td>2</td><td>2</td><td colspan="3">lo ＝ hi で終了 → 2</td></tr></table></div>
<p>最初の 3 の位置 <b>2</b> が返ります。</p>`},
  {t:"選択肢を消す",h:`<ul class="elim">
<li class="o"><b>イ</b><span>正解。</span></li>
<li class="x"><b>エ</b><span>最初に見た mid（4）で止めた場合。</span></li>
<li class="x"><b>オ</b><span>t より大きい最初の位置（upper bound）。</span></li>
<li class="x"><b>ア・ウ</b><span>根拠なし。</span></li></ul>`}],
  sum:{type:"二分探索の変形（境界探し）",label:"hi ← mid ＝「mid を候補に残して左を探す」",tip:"lo ＜ hi と hi ← mid の組は「境界の位置」を探す形。一致しても止まらないので、等しい値が複数ある例で試す。"}
}
]);
