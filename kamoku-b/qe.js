window.PX = (window.PX || []).concat([
{ id:"oe-1", year:"整列", no:1, topic:"バブルソート1回目",
  stem:`<p>次の記述中の［　　］に入れる正しい答えを，解答群の中から選べ。ここで，配列の要素番号は 1 から始まる。</p>
<p>手続 bubbleSort は，大域の整数型の配列 data を昇順に整列する。data が {5, 3, 8, 1, 4} のとき，/*** α ***/ の行を最初に実行した直後の data の内容は［　　］である。</p>`,
  code:[
".大域: 整数型の配列: data ← {5, 3, 8, 1, 4}",
".",
".○bubbleSort()",
".   整数型: i, j, tmp",
"+   整数型: n ← dataの要素数",
"+   for (i を 1 から n － 1 まで 1 ずつ増やす)",
"!      for (j を 1 から n － i まで 1 ずつ増やす)",
"!         if (data[j] ＞ data[j ＋ 1])",
"!            tmp ← data[j]",
"!            data[j] ← data[j ＋ 1]",
"!            data[j ＋ 1] ← tmp",
".         endif",
".      endfor",
"!      /*** α ***/",
".   endfor"],
  choices:{rows:[["ア","{3, 5, 1, 4, 8}"],["イ","{1, 3, 4, 5, 8}"],["ウ","{3, 5, 8, 1, 4}"],["エ","{3, 1, 4, 5, 8}"],["オ","{1, 5, 8, 3, 4}"]]},
  ans:"ア",
  steps:[
  {t:"設問と選択肢を先に見る",h:`<p>α は外側ループの1周の終わりです。「最初に実行した直後」なので、<b>内側ループ1周分（i ＝ 1）だけ</b>を追えば足ります。</p>`},
  {t:"選択肢どうしの違いを見る",h:`<p>イは完全に整列した結果（最後まで回した場合）、エは2周目の後の形です。<span class="mk">1周目の後は「最大値が末尾に来る」</span>はずなので、末尾が 8 の選択肢（ア・イ・エ）が残ります。</p>`},
  {t:"目的を1行でつかむ",h:`<p class="mk">隣どうしを比べて、大きい方を右へ送る。1周で最大値が末尾に沈む。</p>`},
  {t:"空欄の周りだけ読む",map:true,h:`<p>内側の3行は「交換」の定番形です。中身は追わず「data[j] と data[j＋1] を交換」と読みます。</p>`},
  {t:"小さい例でトレース",h:`<div class="tw"><table class="tr"><tr><th>j</th><th>比べる組</th><th>交換？</th><th>data</th></tr>
<tr><td>1</td><td>5, 3</td><td>する</td><td>{3, 5, 8, 1, 4}</td></tr>
<tr><td>2</td><td>5, 8</td><td>しない</td><td>{3, 5, 8, 1, 4}</td></tr>
<tr><td>3</td><td>8, 1</td><td>する</td><td>{3, 5, 1, 8, 4}</td></tr>
<tr class="em"><td>4</td><td>8, 4</td><td>する</td><td>{3, 5, 1, 4, 8}</td></tr></table></div>
<p>8 が交換されるたびに右へ運ばれていくのが分かります。</p>`},
  {t:"選択肢を消す",h:`<ul class="elim">
<li class="o"><b>ア</b><span>正解。</span></li>
<li class="x"><b>イ</b><span>最後まで整列した結果。</span></li>
<li class="x"><b>ウ</b><span>j ＝ 1 の交換だけの状態。</span></li>
<li class="x"><b>エ</b><span>2 周目の後。</span></li>
<li class="x"><b>オ</b><span>選択ソートの1周目（最小値を先頭と交換）の形。</span></li></ul>`}],
  sum:{type:"バブルソート",label:"内側 for ＝「最大値を末尾へ運ぶ1周」",tip:"「最初の1周の後」は、整列の種類ごとの特徴（バブル：最大が末尾、選択：最小が先頭）で選択肢を絞ってから確かめる。"}
},
{ id:"oe-2", year:"整列", no:2, topic:"交換の回数",
  stem:`<p>次の記述中の［　　］に入れる正しい答えを，解答群の中から選べ。</p>
<p>整列の問題 1 の手続 bubbleSort で，data を {4, 3, 1, 2} にして実行したとき，data[j] と data[j ＋ 1] の値の入替えが行われる回数は全部で［　　］回である。</p>`,
  code:[
".大域: 整数型の配列: data ← {4, 3, 1, 2}",
".",
".○bubbleSort()",
".   整数型: i, j, tmp",
"+   整数型: n ← dataの要素数",
"+   for (i を 1 から n － 1 まで 1 ずつ増やす)",
"+      for (j を 1 から n － i まで 1 ずつ増やす)",
"!         if (data[j] ＞ data[j ＋ 1])",
"!            tmp ← data[j]",
"!            data[j] ← data[j ＋ 1]",
"!            data[j ＋ 1] ← tmp",
".         endif",
".      endfor",
".   endfor"],
  choices:{rows:[["ア","3"],["イ","4"],["ウ","5"],["エ","6"]]},
  ans:"ウ",
  steps:[
  {t:"設問と選択肢を先に見る",h:`<p>入替え（交換）の<b>総回数</b>を数えます。比較の回数（3＋2＋1 ＝ 6）とは違います。エは比較回数の罠です。</p>`},
  {t:"選択肢どうしの違いを見る",h:`<p>3〜6 の数値です。全部トレースしても大きくありませんが、<span class="mk">トレースせずに数える方法</span>もあります。</p>`},
  {t:"目的を1行でつかむ",h:`<p class="mk">隣の交換1回で、「順番が逆の組」がちょうど1つ減る。</p><p>そのため、交換回数 ＝ 最初の配列の中の「前の方が大きい組（転倒）」の数です。</p>`},
  {t:"空欄の周りだけ読む",map:true,h:`<p>{4, 3, 1, 2} の転倒を数えます。</p><ul><li>4 より後ろで 4 より小さい：3, 1, 2 → 3 組</li><li>3 より後ろで 3 より小さい：1, 2 → 2 組</li><li>1 より後ろで 1 より小さい：なし</li></ul><p>合計 <b>5</b> 組です。</p>`},
  {t:"小さい例でトレース",h:`<p>念のためトレースでも確かめます。</p>
<div class="tw"><table class="tr"><tr><th>i</th><th>内側の比較と交換</th><th>交換</th><th>data</th></tr>
<tr><td>1</td><td>(4,3)交換 (4,1)交換 (4,2)交換</td><td>3</td><td>{3, 1, 2, 4}</td></tr>
<tr><td>2</td><td>(3,1)交換 (3,2)交換</td><td>2</td><td>{1, 2, 3, 4}</td></tr>
<tr class="em"><td>3</td><td>(1,2)</td><td>0</td><td>{1, 2, 3, 4}</td></tr></table></div>`},
  {t:"選択肢を消す",h:`<ul class="elim">
<li class="o"><b>ウ</b><span>正解。</span></li>
<li class="x"><b>エ</b><span>比較の回数。</span></li>
<li class="x"><b>ア・イ</b><span>数え漏れ。</span></li></ul>`}],
  sum:{type:"バブルソート（交換回数）",label:"交換1回 ＝「逆順の組が1つ減る」",tip:"バブルソートと挿入ソートの交換（移動）回数は、転倒の数と等しい。比較回数と取り違えない。"}
},
{ id:"oe-3", year:"整列", no:3, topic:"選択ソート",
  stem:`<p>次のプログラム中の［　　］に入れる正しい答えを，解答群の中から選べ。ここで，配列の要素番号は 1 から始まる。</p>
<p>手続 selectionSort は，大域の整数型の配列 data を昇順に整列する。各 i について，data[i] 〜 data[n] の中の最小値を探し，data[i] と入れ替える。</p>`,
  code:[
".○selectionSort()",
".   整数型: i, j, minIdx, tmp",
"+   整数型: n ← dataの要素数",
"+   for (i を 1 から n － 1 まで 1 ずつ増やす)",
"+      minIdx ← i",
"!      for (j を [[]] から n まで 1 ずつ増やす)",
"+         if (data[j] ＜ data[minIdx])",
"+            minIdx ← j",
".         endif",
".      endfor",
"+      tmp ← data[i]",
"+      data[i] ← data[minIdx]",
"+      data[minIdx] ← tmp",
".   endfor"],
  fill:{"":"i ＋ 1"},
  choices:{rows:[["ア","1"],["イ","i － 1"],["ウ","i ＋ 1"],["エ","n － i"]]},
  ans:"ウ",
  steps:[
  {t:"設問と選択肢を先に見る",h:`<p>内側の for の開始位置です。問題文に「<span class="mk">data[i] 〜 data[n] の中の最小値</span>」と書かれています。</p>`},
  {t:"選択肢どうしの違いを見る",h:`<p>1（先頭から）、i－1、i＋1、n－i。直前に minIdx ← i としているので、data[i] は<b>すでに候補に入っています</b>。比べる相手は i＋1 からで足ります。</p>`},
  {t:"目的を1行でつかむ",h:`<p class="mk">未整列の部分（i〜n）から最小値を選び、先頭 i に置く。</p><p>1〜i－1 は整列済みなので、そこを探してはいけません。</p>`},
  {t:"空欄の周りだけ読む",map:true,h:`<p>開始が 1 や i－1 だと整列済みの部分も探し、すでに置いた小さい値を引っ張り出してしまいます。</p>`},
  {t:"小さい例でトレース",h:`<p>{3, 1, 2} で比べます。</p>
<div class="tw"><table class="tr"><tr><th>i</th><th>ウ：探す範囲</th><th>ウの data</th><th>ア：探す範囲</th><th>アの data</th></tr>
<tr><td>1</td><td>2〜3 → 最小は 1</td><td>{1, 3, 2}</td><td>1〜3 → 1</td><td>{1, 3, 2}</td></tr>
<tr class="em"><td>2</td><td>3〜3 → 2</td><td>{1, 2, 3} ○</td><td>1〜3 → 最小は data[1] ＝ 1</td><td>data[2] と data[1] を交換 {3, 1, 2} ×</td></tr></table></div>`},
  {t:"選択肢を消す",h:`<ul class="elim">
<li class="x"><b>ア</b><span>整列済みの部分も探して壊してしまう。</span></li>
<li class="x"><b>イ</b><span>1つ前の整列済みの要素を候補に入れてしまう（i ＝ 1 なら 0 番目で領域外）。</span></li>
<li class="o"><b>ウ</b><span>正解。</span></li>
<li class="x"><b>エ</b><span>探す範囲がずれる。</span></li></ul>`}],
  sum:{type:"選択ソート",label:"内側 for ＝「残りの中の最小値を探す」",tip:"整列のループは「整列済みの部分」と「未整列の部分」の境目を i で表している。内側がどちらを見るべきかを確かめる。"}
},
{ id:"oe-4", year:"整列", no:4, topic:"挿入ソート",
  stem:`<p>次のプログラム中の［　　］に入れる正しい答えを，解答群の中から選べ。ここで，配列の要素番号は 1 から始まる。</p>
<p>手続 insertionSort は，大域の整数型の配列 data を昇順に整列する。各 i について，data[i] の値を，整列済みの data[1] 〜 data[i － 1] の適切な位置に挿入する。</p>`,
  code:[
".○insertionSort()",
".   整数型: i, j, key",
"+   for (i を 2 から dataの要素数 まで 1 ずつ増やす)",
"+      key ← data[i]",
"+      j ← i － 1",
"+      while ((j ≧ 1) and (data[j] ＞ key))",
"+         data[j ＋ 1] ← data[j]",
"+         j ← j － 1",
".      endwhile",
"!      data[[[]]] ← key",
".   endfor"],
  fill:{"":"j ＋ 1"},
  choices:{rows:[["ア","j"],["イ","j ＋ 1"],["ウ","j － 1"],["エ","i"]]},
  ans:"イ",
  steps:[
  {t:"設問と選択肢を先に見る",h:`<p>while が終わった後、key を<b>どこに置くか</b>です。j が最後にどこを指しているかで決まります。</p>`},
  {t:"選択肢どうしの違いを見る",h:`<p>j、j＋1、j－1、i。<span class="mk">while を抜けたときの j の意味</span>を考えれば、±1 で迷いません。</p>`},
  {t:"目的を1行でつかむ",h:`<p class="mk">key より大きい要素を1つずつ右へずらし、空いたところに key を入れる。</p>`},
  {t:"空欄の周りだけ読む",map:true,h:`<p>while を抜けるのは、j ＝ 0（先頭まで全部ずらした）か、data[j] ≦ key（key 以下の値が見つかった）のときです。どちらの場合も、key を入れるのは<b>その1つ右の j＋1</b> です。</p>`},
  {t:"小さい例でトレース",h:`<p>{2, 5, 3} で i ＝ 3（key ＝ 3）を追います。</p>
<div class="tw"><table class="tr"><tr><th>j</th><th>data[j] ＞ 3？</th><th>処理</th><th>data</th></tr>
<tr><td>2</td><td>5 ＞ 3 真</td><td>data[3] ← 5、j ← 1</td><td>{2, 5, 5}</td></tr>
<tr><td>1</td><td>2 ＞ 3 偽</td><td>終了</td><td>{2, 5, 5}</td></tr>
<tr class="em"><td colspan="2">data[j＋1] ＝ data[2] ← 3</td><td></td><td>{2, 3, 5}</td></tr></table></div>
<p>data[j] ＝ data[1] に入れると 2 を上書きして {3, 5, 5} になります。</p>`},
  {t:"選択肢を消す",h:`<ul class="elim">
<li class="x"><b>ア</b><span>key 以下の値を上書きする（j ＝ 0 なら領域外）。</span></li>
<li class="o"><b>イ</b><span>正解。</span></li>
<li class="x"><b>ウ</b><span>2つ左になる。</span></li>
<li class="x"><b>エ</b><span>元の位置に戻すだけで、ずらした分が重複する。</span></li></ul>`}],
  sum:{type:"挿入ソート",label:"while ＝「key より大きいものを右へずらす」",tip:"「条件が偽になって抜けた位置」の1つ隣が答えになる問題は多い。抜けた理由ごと（端に着いた／条件を満たさなくなった）に確かめる。"}
},
{ id:"oe-5", year:"整列", no:5, topic:"計数ソート",
  stem:`<p>次のプログラム中の［　　］に入れる正しい答えを，解答群の中から選べ。ここで，配列の要素番号は 1 から始まる。</p>
<p>関数 countingSort は，各要素が 1 以上 maxV 以下の整数である整数型の配列 data を受け取り，昇順に整列した配列を返す。各値の出現回数を数え，小さい値から出現回数分ずつ並べることで整列する。</p>`,
  code:[
".○整数型の配列: countingSort(整数型の配列: data, 整数型: maxV)",
"+   整数型の配列: cnt ← {maxV個の 0}",
".   整数型の配列: result ← {dataの要素数個の 0}",
".   整数型: i, v, c",
"+   整数型: k ← 1",
"+   for (i を 1 から dataの要素数 まで 1 ずつ増やす)",
"+      cnt[data[i]] ← cnt[data[i]] ＋ 1",
".   endfor",
"+   for (v を 1 から maxV まで 1 ずつ増やす)",
"!      for (c を 1 から [[]] まで 1 ずつ増やす)",
"+         result[k] ← v",
"+         k ← k ＋ 1",
".      endfor",
".   endfor",
".   return result"],
  fill:{"":"cnt[v]"},
  choices:{rows:[["ア","cnt[v]"],["イ","v"],["ウ","cnt[k]"],["エ","k"]]},
  ans:"ア",
  steps:[
  {t:"設問と選択肢を先に見る",h:`<p>内側の for の回数です。本体は「result に v を1つ書く」なので、<b>v を何個書くか</b>を選びます。</p>`},
  {t:"選択肢どうしの違いを見る",h:`<p>cnt[v]（v の出現回数）、v（値そのもの）、cnt[k]、k。問題文の「<span class="mk">出現回数分ずつ並べる</span>」がそのまま答えです。</p>`},
  {t:"目的を1行でつかむ",h:`<p class="mk">値 1 から順に、その値を出現回数ぶん書き出す。</p>`},
  {t:"空欄の周りだけ読む",map:true,h:`<p>最初の for は「出現回数を数える」（配列・ループ 問11 と同じ形）です。cnt[v] が v の個数なので、内側の for を cnt[v] 回まわします。cnt[v] が 0 なら1回も書きません。</p>`},
  {t:"小さい例でトレース",h:`<p>data ＝ {3, 1, 3}、maxV ＝ 3 で追います。cnt ＝ {1, 0, 2}。</p>
<div class="tw"><table class="tr"><tr><th>v</th><th>cnt[v]</th><th>書く値</th><th>result</th></tr>
<tr><td>1</td><td>1</td><td>1</td><td>{1, 0, 0}</td></tr>
<tr><td>2</td><td>0</td><td>なし</td><td>{1, 0, 0}</td></tr>
<tr class="em"><td>3</td><td>2</td><td>3, 3</td><td>{1, 3, 3}</td></tr></table></div>
<p>イ（v 回）だと 1 を1個、2 を2個、3 を3個書こうとして、data にない 2 が入り、result の範囲も超えます。</p>`},
  {t:"選択肢を消す",h:`<ul class="elim">
<li class="o"><b>ア</b><span>正解。</span></li>
<li class="x"><b>イ</b><span>値の大きさぶん書いてしまう。</span></li>
<li class="x"><b>ウ</b><span>k は書き込み位置で、値ではない。</span></li>
<li class="x"><b>エ</b><span>k は書くたびに増えるので、回数が定まらない。</span></li></ul>`}],
  sum:{type:"計数ソート",label:"二重 for ＝「値 v を cnt[v] 個書き出す」",tip:"比較をしない整列（計数ソート）は「数える → 並べる」の2段。値の範囲が狭いときに使う。"}
},
{ id:"oe-6", year:"整列", no:6, topic:"マージソートの回数",
  stem:`<p>次の記述中の［　　］に入れる正しい答えを，解答群の中から選べ。</p>
<p>手続 mergeSort は，大域の整数型の配列 data の要素番号 first から last までを昇順に整列する。手続 merge(first, mid, last) は，整列済みの data[first]〜data[mid] と data[mid ＋ 1]〜data[last] を併合して，data[first]〜data[last] を整列済みにする。data の要素数が 8 のとき，mergeSort(1, 8) を呼び出すと，手続 merge は全部で［　　］回呼び出される。</p>`,
  code:[
".○mergeSort(整数型: first, 整数型: last)",
".   整数型: mid",
"+   if (first ＜ last)",
"+      mid ← (first ＋ last) ÷ 2 の商",
"+      mergeSort(first, mid)",
"+      mergeSort(mid ＋ 1, last)",
"!      merge(first, mid, last)",
".   endif"],
  choices:{rows:[["ア","3"],["イ","4"],["ウ","7"],["エ","8"],["オ","15"]]},
  ans:"ウ",
  steps:[
  {t:"設問と選択肢を先に見る",h:`<p>merge の呼び出し回数です。merge は <b>first ＜ last のとき（要素が2個以上の区間）にだけ</b>呼ばれます。</p>`},
  {t:"選択肢どうしの違いを見る",h:`<p>15 は mergeSort 自体の呼び出し回数、8 は要素数、3 は段数（log<sub>2</sub>8）です。<span class="mk">何を数えているか</span>を取り違えないようにします。</p>`},
  {t:"目的を1行でつかむ",h:`<p class="mk">区間を半分に割り続け、戻るときに2つを1つに併合する。</p><p>併合1回で「区間の数」が1つ減ります。8 個の区間（1要素ずつ）を1つにするには <b>8 － 1 ＝ 7 回</b>の併合が必要です。</p>`},
  {t:"空欄の周りだけ読む",map:true,h:`<p>回数だけなので、分割の木を描いて「2要素以上の区間」の数を数えれば確かめられます。</p>`},
  {t:"小さい例でトレース",h:`<div class="code"><span class="ln">[1-8]                       merge 1</span><span class="ln">├ [1-4]                     merge 1</span><span class="ln">│ ├ [1-2] merge 1   ├ [3-4] merge 1</span><span class="ln">└ [5-8]                     merge 1</span><span class="ln">  ├ [5-6] merge 1   ├ [7-8] merge 1</span><span class="ln">（1要素の区間 8 個は merge なし）</span></div>
<p>1 ＋ 2 ＋ 4 ＝ <b>7</b> 回です。</p>`},
  {t:"選択肢を消す",h:`<ul class="elim">
<li class="o"><b>ウ</b><span>正解。</span></li>
<li class="x"><b>オ</b><span>mergeSort の呼び出し回数（7 ＋ 8）。</span></li>
<li class="x"><b>エ</b><span>要素数。</span></li>
<li class="x"><b>ア</b><span>分割の段数。</span></li>
<li class="x"><b>イ</b><span>一番下の段の merge だけ。</span></li></ul>`}],
  sum:{type:"マージソート（分割統治）",label:"merge ＝「2つの区間を1つにする」",tip:"「併合1回で区間が1つ減る」と考えれば、n 要素の併合回数は n－1。木を描けば検算できる。"}
},
{ id:"oe-7", year:"整列", no:7, topic:"安定な整列",
  stem:`<p>次のプログラム中の［　　］に入れる正しい答えを，解答群の中から選べ。ここで，配列の要素番号は 1 から始まる。</p>
<p>クラス Record は，メンバ変数 score（整数型）と name（文字列型）をもつ。手続 sortByScore は，Record の配列 recs を score の昇順に整列する。このとき，score が等しいレコードどうしは，整列前の並び順を保つ（安定な整列）ようにしたい。</p>`,
  code:[
".○sortByScore(Recordの配列: recs)",
".   整数型: i, j",
".   Record: tmp",
"+   整数型: n ← recsの要素数",
"+   for (i を 1 から n － 1 まで 1 ずつ増やす)",
"+      for (j を 1 から n － i まで 1 ずつ増やす)",
"!         if (recs[j].score [[]] recs[j ＋ 1].score)",
"+            tmp ← recs[j]",
"+            recs[j] ← recs[j ＋ 1]",
"+            recs[j ＋ 1] ← tmp",
".         endif",
".      endfor",
".   endfor"],
  fill:{"":"＞"},
  choices:{rows:[["ア","＞"],["イ","≧"],["ウ","＜"],["エ","≦"]]},
  ans:"ア",
  steps:[
  {t:"設問と選択肢を先に見る",h:`<p>比較演算子1つです。昇順かどうかに加えて、<b>同じ score のときに交換するかどうか</b>が問われています。</p>`},
  {t:"選択肢どうしの違いを見る",h:`<p>＞・≧ は昇順、＜・≦ は降順になります。昇順のうち、<span class="mk">＞ と ≧ の違いは「等しいときに交換するか」</span>だけです。</p>`},
  {t:"目的を1行でつかむ",h:`<p class="mk">前の方が大きいときだけ交換する。等しいときは交換しない。</p><p>隣どうしの交換で整列する方法は、等しいものを入れ替えなければ元の順序が保たれます。</p>`},
  {t:"空欄の周りだけ読む",map:true,h:`<p>recs[j].score のように、. でメンバ変数を参照しています。比較しているのは score だけで、name は関係ありません。</p>`},
  {t:"小さい例でトレース",h:`<p>(80, "佐藤")、(80, "鈴木")、(70, "田中") で比べます。正しい結果は 田中、佐藤、鈴木 の順です。</p>
<div class="tw"><table class="tr"><tr><th>比較</th><th>ア（＞）</th><th>イ（≧）</th></tr>
<tr><td>佐藤 80 と 鈴木 80</td><td>交換しない</td><td>交換する → 鈴木, 佐藤</td></tr>
<tr class="em"><td>最終結果</td><td>田中, 佐藤, 鈴木 ○</td><td>田中, 鈴木, 佐藤 ×</td></tr></table></div>`},
  {t:"選択肢を消す",h:`<ul class="elim">
<li class="o"><b>ア</b><span>正解。</span></li>
<li class="x"><b>イ</b><span>同点どうしを入れ替えてしまい、安定でなくなる。</span></li>
<li class="x"><b>ウ・エ</b><span>降順になる。</span></li></ul>`}],
  sum:{type:"整列の安定性",label:"if ＝「真に大きいときだけ交換」",tip:"「安定」と書かれていたら、等号を含むかどうか（＞ か ≧ か）が問われている。同じキーを2つ含む例で試す。"}
},
{ id:"oe-8", year:"整列", no:8, topic:"クイックソートの分割",
  stem:`<p>次の記述中の［　　］に入れる正しい答えを，解答群の中から選べ。ここで，配列の要素番号は 1 から始まる。</p>
<p>関数 partition は，大域の整数型の配列 data の data[first] 〜 data[last] について，data[last] の値を基準値とし，基準値より小さい値を前に，それ以外を後ろに集め，基準値の移動先の要素番号を返す。data が {4, 7, 2, 6, 1, 5} のとき，partition(1, 6) を実行した直後の data の内容は［　　］である。</p>`,
  code:[
".大域: 整数型の配列: data ← {4, 7, 2, 6, 1, 5}",
".",
".○整数型: partition(整数型: first, 整数型: last)",
"+   整数型: pivot ← data[last]",
"+   整数型: i ← first － 1",
".   整数型: j, tmp",
"+   for (j を first から last － 1 まで 1 ずつ増やす)",
"!      if (data[j] ＜ pivot)",
"!         i ← i ＋ 1",
"!         data[i] と data[j] の値を入れ替える",
".      endif",
".   endfor",
"+   data[i ＋ 1] と data[last] の値を入れ替える",
".   return i ＋ 1"],
  choices:{rows:[["ア","{4, 2, 1, 5, 7, 6}"],["イ","{1, 2, 4, 5, 6, 7}"],["ウ","{4, 2, 1, 5, 6, 7}"],["エ","{2, 1, 4, 5, 7, 6}"],["オ","{4, 2, 1, 6, 7, 5}"]]},
  ans:"ア",
  steps:[
  {t:"設問と選択肢を先に見る",h:`<p>分割1回の結果を答えます。整列しきった結果（イ）は罠です。<b>分割は左右に振り分けるだけで、左右それぞれの中は整列されません</b>。</p>`},
  {t:"選択肢どうしの違いを見る",h:`<p>ア・ウ・オは前3つが {4, 2, 1}。<span class="mk">基準値 5 が4番目に来ているか</span>と、<span class="mk">後ろの 7, 6 の順番</span>が分かれ目です。</p>`},
  {t:"目的を1行でつかむ",h:`<p class="mk">i は「5 より小さい値の並びの末尾」。小さい値を見つけたら、i を1つ進めてそこへ入れる。</p>`},
  {t:"空欄の周りだけ読む",map:true,h:`<p>for の中は「小さい値を左の領域に加える」とラベルを付けます。最後の入替えで、基準値を左の領域の直後に置きます。</p>`},
  {t:"小さい例でトレース",h:`<div class="tw"><table class="tr"><tr><th>j</th><th>data[j]</th><th>5 より小？</th><th>i</th><th>data</th></tr>
<tr><td>1</td><td>4</td><td>○</td><td>1</td><td>{4, 7, 2, 6, 1, 5}（自分と交換）</td></tr>
<tr><td>2</td><td>7</td><td>×</td><td>1</td><td>{4, 7, 2, 6, 1, 5}</td></tr>
<tr><td>3</td><td>2</td><td>○</td><td>2</td><td>{4, 2, 7, 6, 1, 5}</td></tr>
<tr><td>4</td><td>6</td><td>×</td><td>2</td><td>{4, 2, 7, 6, 1, 5}</td></tr>
<tr><td>5</td><td>1</td><td>○</td><td>3</td><td>{4, 2, 1, 6, 7, 5}</td></tr>
<tr class="em"><td colspan="3">data[4] と data[6] を交換</td><td></td><td>{4, 2, 1, 5, 7, 6}</td></tr></table></div>
<p>オは最後の入替えを忘れた状態です。</p>`},
  {t:"選択肢を消す",h:`<ul class="elim">
<li class="o"><b>ア</b><span>正解。</span></li>
<li class="x"><b>イ</b><span>整列の最終結果。</span></li>
<li class="x"><b>ウ</b><span>右側が整列されている（分割では右側は整列されない）。</span></li>
<li class="x"><b>エ</b><span>左側の並びが違う。</span></li>
<li class="x"><b>オ</b><span>最後の基準値の入替えを忘れている。</span></li></ul>`}],
  sum:{type:"クイックソート（分割）",label:"i ＝「基準値未満の領域の末尾」",tip:"分割の結果は「基準値未満｜基準値｜基準値以上」になるだけ。左右の中が整列済みの選択肢は罠。"}
}
]);
