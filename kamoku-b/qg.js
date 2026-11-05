window.PX = (window.PX || []).concat([
{ id:"og-1", year:"データ構造", no:1, topic:"リングバッファのキュー",
  stem:`<p>次のプログラム中の［　　］に入れる正しい答えを，解答群の中から選べ。ここで，配列の要素番号は 1 から始まる。</p>
<p>要素数 5 の大域の配列 queue を使って，最大 5 個の整数を格納できるキューを実現する。head は次に取り出す位置，tail は次に格納する位置，count は格納されている個数を表す。queue の末尾の次は先頭に戻って使う（リングバッファ）。</p>`,
  code:[
".大域: 整数型の配列: queue ← {5個の 未定義の値}",
"+大域: 整数型: head ← 1",
"+大域: 整数型: tail ← 1",
".大域: 整数型: count ← 0",
".",
".○論理型: enqueue(整数型: v)",
".   if (count ＝ 5)",
".      return false",
".   endif",
"+   queue[tail] ← v",
"!   tail ← [[]]",
".   count ← count ＋ 1",
".   return true",
".",
".○整数型: dequeue()",
".   整数型: v ← queue[head]",
"+   head ← (head mod 5) ＋ 1",
".   count ← count － 1",
".   return v"],
  fill:{"":"(tail mod 5) ＋ 1"},
  choices:{rows:[["ア","tail ＋ 1"],["イ","(tail mod 5) ＋ 1"],["ウ","(tail ＋ 1) mod 5"],["エ","tail mod 5"]]},
  ans:"イ",
  steps:[
  {t:"設問と選択肢を先に見る",h:`<p>tail を次の位置に進める式です。<b>dequeue に head を進める式が書いてある</b>ので、それが最大のヒントです。</p>`},
  {t:"選択肢どうしの違いを見る",h:`<p>ただの ＋1（ア）か、mod で循環させるか。循環させる式のうち、<span class="mk">結果が 1〜5 の範囲に収まるか</span>が分かれ目です。</p>`},
  {t:"目的を1行でつかむ",h:`<p class="mk">tail を1つ進める。5 の次は 1 に戻る。</p><p>head と tail は同じ配列の上を同じ向きに進むので、進め方も同じ式になります。</p>`},
  {t:"空欄の周りだけ読む",map:true,h:`<p>dequeue の <code class="i">head ← (head mod 5) ＋ 1</code> と同じ形のイが答えです。各選択肢に tail ＝ 4 と 5 を入れて確かめます。</p>`},
  {t:"小さい例でトレース",h:`<div class="tw"><table class="tr"><tr><th>tail</th><th>ア tail＋1</th><th>イ (tail mod 5)＋1</th><th>ウ (tail＋1) mod 5</th><th>エ tail mod 5</th></tr>
<tr><td>1</td><td>2</td><td>2</td><td>2</td><td>1</td></tr>
<tr><td>4</td><td>5</td><td>5</td><td>0 ×</td><td>4</td></tr>
<tr class="em"><td>5</td><td>6 ×</td><td>1 ○</td><td>1</td><td>0 ×</td></tr></table></div>
<p>ウは tail ＝ 4 で 0 になり、要素番号 0 は存在しません。</p>`},
  {t:"選択肢を消す",h:`<ul class="elim">
<li class="x"><b>ア</b><span>先頭に戻らず、6 番目（領域外）に進む。</span></li>
<li class="o"><b>イ</b><span>正解。</span></li>
<li class="x"><b>ウ</b><span>0 になることがある（0 始まりの配列用の式）。</span></li>
<li class="x"><b>エ</b><span>進まないうえ、0 にもなる。</span></li></ul>`}],
  sum:{type:"キュー（リングバッファ）",label:"tail ＝「次に入れる位置（循環）」",tip:"1 始まりの配列で循環させる式は (i mod n) ＋ 1。0 始まり用の (i＋1) mod n と区別する。同じプログラム内の似た行が答えになっていることが多い。"}
},
{ id:"og-2", year:"データ構造", no:2, topic:"逆ポーランド記法",
  stem:`<p>次の記述中の［　　］に入れる正しい答えを，解答群の中から選べ。</p>
<p>関数 evaluate は，逆ポーランド記法で書かれた式を，空白で区切った字句の配列として受け取り，その値を返す。字句は整数又は演算子（＋，－，×）である。関数 push と pop はスタックへの格納と取出しを行う。evaluate({"5", "1", "2", "＋", "4", "×", "＋", "3", "－"}) の戻り値は［　　］である。</p>`,
  code:[
".○整数型: evaluate(文字列型の配列: tokens)",
".   整数型: i, a, b",
"+   for (i を 1 から tokensの要素数 まで 1 ずつ増やす)",
"+      if (tokens[i] が 整数)",
"+         push(tokens[i] が表す整数)",
".      else",
"!         b ← pop()",
"!         a ← pop()",
"!         push(a と b に tokens[i] の演算を行った結果)  // a 演算子 b",
".      endif",
".   endfor",
".   return pop()"],
  choices:{rows:[["ア","14"],["イ","－14"],["ウ","16"],["エ","20"],["オ","8"]]},
  ans:"ア",
  steps:[
  {t:"設問と選択肢を先に見る",h:`<p>式の値を答えます。逆ポーランド記法は<b>演算子が後ろに来る書き方</b>で、スタックで計算します。</p>`},
  {t:"選択肢どうしの違いを見る",h:`<p>14 と －14 は、－ の左右を逆にしたかどうかの違いです。<span class="mk">先に pop した方が右側（b）</span>です。</p>`},
  {t:"目的を1行でつかむ",h:`<p class="mk">数は積む。演算子が来たら上の2つを取り出して計算し、結果を積む。</p>`},
  {t:"空欄の周りだけ読む",map:true,h:`<p>b ← pop() が先なので、<b>スタックの一番上が右側の値</b>です。「5 3 －」なら 5 － 3 です。</p>`},
  {t:"小さい例でトレース",h:`<div class="tw"><table class="tr"><tr><th>字句</th><th>処理</th><th>スタック（右が上）</th></tr>
<tr><td>5, 1, 2</td><td>積む</td><td>5 1 2</td></tr>
<tr><td>＋</td><td>1 ＋ 2</td><td>5 3</td></tr>
<tr><td>4</td><td>積む</td><td>5 3 4</td></tr>
<tr><td>×</td><td>3 × 4</td><td>5 12</td></tr>
<tr><td>＋</td><td>5 ＋ 12</td><td>17</td></tr>
<tr><td>3</td><td>積む</td><td>17 3</td></tr>
<tr class="em"><td>－</td><td>17 － 3</td><td>14</td></tr></table></div>
<p>普通の書き方では 5 ＋ (1 ＋ 2) × 4 － 3 ＝ 14 です。</p>`},
  {t:"選択肢を消す",h:`<ul class="elim">
<li class="o"><b>ア</b><span>正解。</span></li>
<li class="x"><b>イ</b><span>最後の － で左右を逆にした（3 － 17）。</span></li>
<li class="x"><b>ウ・エ・オ</b><span>計算の順番の読み違い。</span></li></ul>`}],
  sum:{type:"スタック（式の評価）",label:"演算子 ＝「上の2つで計算して積み直す」",tip:"pop の順番に注意。先に取り出したのが右側の値。スタックの中身を1行ずつ横に書く表で追う。"}
},
{ id:"og-3", year:"データ構造", no:3, topic:"リストへの挿入",
  stem:`<p>次のプログラム中の［ a ］と［ b ］に入れる正しい答えの組合せを，解答群の中から選べ。ここで，配列の要素番号は 1 から始まる。</p>
<p>単方向リストを，値を格納する配列 val と，次の要素の要素番号を格納する配列 next で表す（IPA 令和8年度 問4 と同様の表現）。手続 insertAfter は，要素番号 p の要素の直後に，要素番号 k の空き領域を使って値 v の要素を挿入する。</p>`,
  code:[
".○insertAfter(整数型: p, 整数型: k, 整数型: v)",
"+   val[k] ← v",
"!   [[a]]",
"!   [[b]]"],
  fill:{a:"next[k] ← next[p]",b:"next[p] ← k"},
  choices:{cols:["a","b"],rows:[["ア","next[k] ← next[p]","next[p] ← k"],["イ","next[p] ← k","next[k] ← next[p]"],["ウ","next[k] ← p","next[p] ← k"],["エ","next[p] ← next[k]","next[k] ← p"]]},
  ans:"ア",
  steps:[
  {t:"設問と選択肢を先に見る",h:`<p>リストのつなぎ替え2行です。アとイは<b>同じ2文で順番だけが逆</b>なので、順番が問われています。</p>`},
  {t:"選択肢どうしの違いを見る",h:`<p>新しい要素 k の次を、p の元の次にする（next[k] ← next[p]）。p の次を k にする（next[p] ← k）。この2つが必要です。<span class="mk">どちらを先にやるか</span>で結果が変わります。</p>`},
  {t:"目的を1行でつかむ",h:`<p class="mk">p → q だったところを p → k → q にする。</p>`},
  {t:"空欄の周りだけ読む",map:true,h:`<p>先に next[p] ← k をすると、<b>元の次（q）の番号が消えてしまい</b>、k から q につなげなくなります。だから、先に k から q へつなぎ、その後で p から k へつなぎます。</p>`},
  {t:"小さい例でトレース",h:`<p>リスト 1 → 2（next[1] ＝ 2）の 1 の後ろに、k ＝ 5 を挿入します。</p>
<div class="tw"><table class="tr"><tr><th>順番</th><th>1行目の後</th><th>2行目の後</th><th>結果</th></tr>
<tr class="em"><td>ア</td><td>next[5] ＝ 2</td><td>next[1] ＝ 5</td><td>1 → 5 → 2 ○</td></tr>
<tr><td>イ</td><td>next[1] ＝ 5</td><td>next[5] ＝ next[1] ＝ 5</td><td>1 → 5 → 5 → …（自分を指す）×</td></tr></table></div>`},
  {t:"選択肢を消す",h:`<ul class="elim">
<li class="o"><b>ア</b><span>正解。</span></li>
<li class="x"><b>イ</b><span>k が自分自身を指し、2 以降が切り離される。</span></li>
<li class="x"><b>ウ</b><span>k の次が p になり、逆戻りする。</span></li>
<li class="x"><b>エ</b><span>未設定の next[k] を p に入れてしまう。</span></li></ul>`}],
  sum:{type:"連結リスト（挿入）",label:"2行 ＝「新しい要素から先につなぐ」",tip:"リストのつなぎ替えは「後でまだ使う値を先に上書きしていないか」を確かめる。1→2 の2要素で図を描けば十分。"}
},
{ id:"og-4", year:"データ構造", no:4, topic:"リストからの削除",
  stem:`<p>次のプログラム中の［　　］に入れる正しい答えを，解答群の中から選べ。</p>
<p>クラス ListElement は，単方向リストの要素を表す。メンバ変数 val は値を，メンバ変数 next は次の要素への参照を表し，末尾の要素の next は未定義である。大域変数 listHead はリストの先頭の要素への参照で，先頭の要素はダミー（値を持たない）である。手続 removeFirst は，ダミー以外の要素のうち，値が x である最初の要素をリストから取り除く。値が x の要素がなければ何もしない。</p>`,
  code:[
".大域: ListElement: listHead",
".",
".○removeFirst(整数型: x)",
"+   ListElement: prev ← listHead",
"+   while (prev.next が 未定義でない)",
"+      if (prev.next.val ＝ x)",
"!         [[]]",
".         return",
".      endif",
"+      prev ← prev.next",
".   endwhile"],
  fill:{"":"prev.next ← prev.next.next"},
  choices:{rows:[["ア","prev.next ← prev.next.next"],["イ","prev ← prev.next.next"],["ウ","prev.next.next ← prev"],["エ","prev.next ← prev"]]},
  ans:"ア",
  steps:[
  {t:"設問と選択肢を先に見る",h:`<p>オブジェクト（クラス）を使ったリストです。<b>メンバ変数への代入（つなぎ替え）</b>か、<b>ローカル変数への代入（見る場所を変えるだけ）</b>かを区別します。</p>`},
  {t:"選択肢どうしの違いを見る",h:`<p>イは prev（ローカル変数）を書き換えるだけで、<span class="mk">リストそのものは何も変わりません</span>。リストを変えるには、どこかの .next に代入する必要があります。</p>`},
  {t:"目的を1行でつかむ",h:`<p class="mk">消したい要素の1つ前（prev）から、消したい要素の次へ直接つなぐ。</p><p>prev を「1つ前」に置いて進むので、prev.next が消したい要素、prev.next.next がその次です。</p>`},
  {t:"空欄の周りだけ読む",map:true,h:`<p>prev → 消す要素 → その次 を、prev → その次 にします。これで消す要素はどこからも辿れなくなり、取り除かれたことになります。</p>`},
  {t:"小さい例でトレース",h:`<p>ダミー → 3 → 7 → 9 から 7 を消します。</p>
<div class="tw"><table class="tr"><tr><th>prev</th><th>prev.next.val</th><th>処理</th></tr>
<tr><td>ダミー</td><td>3</td><td>進む</td></tr>
<tr class="em"><td>3 の要素</td><td>7</td><td>アで 3.next ← 9 → ダミー → 3 → 9</td></tr></table></div>
<p>エだと 3.next ← 3 となり、3 が自分自身を指してリストが壊れます。</p>`},
  {t:"選択肢を消す",h:`<ul class="elim">
<li class="o"><b>ア</b><span>正解。</span></li>
<li class="x"><b>イ</b><span>ローカル変数を変えるだけで、リストは変わらない。</span></li>
<li class="x"><b>ウ</b><span>消す要素の後ろを壊してしまう。</span></li>
<li class="x"><b>エ</b><span>自分自身を指すループができる。</span></li></ul>`}],
  sum:{type:"連結リスト（削除、クラス表現）",label:"prev ＝「消す要素の1つ前」",tip:"リストを変えるのは「.next への代入」だけ。変数への代入は、見る場所を動かしているだけ。"}
},
{ id:"og-5", year:"データ構造", no:5, topic:"二分探索木への挿入",
  stem:`<p>次の記述中の［　　］に入れる正しい答えを，解答群の中から選べ。</p>
<p>二分探索木は，各節について「左の部分木の値はその節の値より小さく，右の部分木の値はその節の値より大きい」という性質を持つ二分木である。空の二分探索木に，次のプログラムで値を 50，30，70，20，40，60，80，35 の順に挿入すると，35 は［　　］になる。</p>`,
  code:[
".○insert(整数型: v)  // 木が空なら v を根とする",
"+   節: cur ← 根",
"+   while (true)",
"!      if (v ＜ cur の値)",
"!         if (cur の左の子 が 未定義)",
".            v を cur の左の子とする",
".            return",
".         endif",
"!         cur ← cur の左の子",
".      else",
"!         if (cur の右の子 が 未定義)",
".            v を cur の右の子とする",
".            return",
".         endif",
"!         cur ← cur の右の子",
".      endif",
".   endwhile"],
  choices:{rows:[["ア","30 の右の子"],["イ","40 の左の子"],["ウ","40 の右の子"],["エ","20 の右の子"]]},
  ans:"イ",
  steps:[
  {t:"設問と選択肢を先に見る",h:`<p>最後に入れる 35 の位置だけを問われています。35 より前の値で木を作り、<b>35 の通り道だけ</b>を追います。</p>`},
  {t:"選択肢どうしの違いを見る",h:`<p>30・40・20 のどこに付くか。<span class="mk">根から順に「小さければ左、大きければ右」</span>と比べていけば、迷う余地はありません。</p>`},
  {t:"目的を1行でつかむ",h:`<p class="mk">根から比べながら下りていき、空いた場所に付ける。</p>`},
  {t:"空欄の周りだけ読む",map:true,h:`<p>先に、35 より前の7つで木を作ります。</p>
<div class="code"><span class="ln">        50</span><span class="ln">      /    \\</span><span class="ln">    30      70</span><span class="ln">   /  \\    /  \\</span><span class="ln">  20  40  60  80</span></div>`},
  {t:"小さい例でトレース",h:`<div class="tw"><table class="tr"><tr><th>cur</th><th>比較</th><th>進む方向</th></tr>
<tr><td>50</td><td>35 ＜ 50</td><td>左（30）</td></tr>
<tr><td>30</td><td>35 ＞ 30</td><td>右（40）</td></tr>
<tr class="em"><td>40</td><td>35 ＜ 40</td><td>左の子が空 → ここに付ける</td></tr></table></div>`},
  {t:"選択肢を消す",h:`<ul class="elim">
<li class="x"><b>ア</b><span>30 の右の子はすでに 40。</span></li>
<li class="o"><b>イ</b><span>正解。</span></li>
<li class="x"><b>ウ</b><span>35 は 40 より小さい。</span></li>
<li class="x"><b>エ</b><span>35 は 30 より大きいので、20 の側には行かない。</span></li></ul>`}],
  sum:{type:"二分探索木（挿入）",label:"while ＝「小さければ左、大きければ右へ下りる」",tip:"木の問題は、まず木を描く。聞かれている値の通り道だけを追えばよい。"}
},
{ id:"og-6", year:"データ構造", no:6, topic:"木のなぞり方",
  stem:`<p>次の記述中の［　　］に入れる正しい答えを，解答群の中から選べ。</p>
<p>次の表の二分木について，手続 visit を根 A を引数として呼び出すと，［　　］の順に節の名前が出力される。“－” は子がない（未定義）ことを表す。</p>
<div class="fig"><table><tr><th>節</th><th>左の子</th><th>右の子</th></tr><tr><td>A</td><td>B</td><td>C</td></tr><tr><td>B</td><td>D</td><td>E</td></tr><tr><td>C</td><td>－</td><td>F</td></tr><tr><td>D</td><td>－</td><td>－</td></tr><tr><td>E</td><td>－</td><td>－</td></tr><tr><td>F</td><td>－</td><td>－</td></tr></table></div>`,
  code:[
".○visit(節: n)",
"+   if (n が 未定義)",
".      return",
".   endif",
"!   visit(n の左の子)",
"!   n の名前を出力する",
"!   visit(n の右の子)"],
  choices:{rows:[["ア","A, B, D, E, C, F"],["イ","D, B, E, A, C, F"],["ウ","D, E, B, F, C, A"],["エ","A, B, C, D, E, F"]]},
  ans:"イ",
  steps:[
  {t:"設問と選択肢を先に見る",h:`<p>出力順を答えます。選択肢は木のなぞり方の4種類（行きがけ・通りがけ・帰りがけ・幅優先）です。</p>`},
  {t:"選択肢どうしの違いを見る",h:`<p>ア＝行きがけ（自分 → 左 → 右）、イ＝通りがけ（左 → 自分 → 右）、ウ＝帰りがけ（左 → 右 → 自分）、エ＝上の段から順。<span class="mk">出力の行が2つの再帰呼び出しの間にある</span>ので、通りがけです。</p>`},
  {t:"目的を1行でつかむ",h:`<p class="mk">左の部分木を全部出してから自分、それから右の部分木。</p>`},
  {t:"空欄の周りだけ読む",map:true,h:`<p>木を描いて確かめます。</p><div class="code"><span class="ln">      A</span><span class="ln">     / \\</span><span class="ln">    B   C</span><span class="ln">   / \\   \\</span><span class="ln">  D   E   F</span></div>`},
  {t:"小さい例でトレース",h:`<div class="tw"><table class="tr"><tr><th>手順</th><th>出力</th></tr>
<tr><td>A の左（B）へ → B の左（D）へ → D の左は空</td><td>D</td></tr>
<tr><td>D の右は空 → B に戻る</td><td>B</td></tr>
<tr><td>B の右（E）</td><td>E</td></tr>
<tr><td>A に戻る</td><td>A</td></tr>
<tr><td>A の右（C）→ C の左は空</td><td>C</td></tr>
<tr class="em"><td>C の右（F）</td><td>F</td></tr></table></div>`},
  {t:"選択肢を消す",h:`<ul class="elim">
<li class="x"><b>ア</b><span>出力が呼び出しの前にある場合（行きがけ）。</span></li>
<li class="o"><b>イ</b><span>正解（通りがけ）。</span></li>
<li class="x"><b>ウ</b><span>出力が両方の呼び出しの後にある場合（帰りがけ）。</span></li>
<li class="x"><b>エ</b><span>キューを使う幅優先の順。</span></li></ul>`}],
  sum:{type:"二分木の走査",label:"出力の位置 ＝「なぞり方の種類」",tip:"出力が再帰の前 → 行きがけ、間 → 通りがけ、後 → 帰りがけ。コードの行の位置だけで種類が決まる。"}
},
{ id:"og-7", year:"データ構造", no:7, topic:"ヒープへの追加",
  stem:`<p>次のプログラム中の［　　］に入れる正しい答えを，解答群の中から選べ。ここで，配列の要素番号は 1 から始まる。</p>
<p>大域の整数型の配列 heap は，最小値を根とする二分ヒープを表す。heap[i] の子は heap[2i] と heap[2i ＋ 1] であり，各節の値はその子の値以下である。手続 push は，値 v を heap の末尾に追加した後，ヒープの性質が成り立つように v を上へ移動させる。</p>`,
  code:[
".大域: 整数型の配列: heap",
".",
".○push(整数型: v)",
".   整数型: i, tmp",
"+   heapの末尾 に v を追加する",
"+   i ← heapの要素数",
"!   while ((i ＞ 1) and ([[]]))",
"+      tmp ← heap[i]",
"+      heap[i] ← heap[i ÷ 2 の商]",
"+      heap[i ÷ 2 の商] ← tmp",
"+      i ← i ÷ 2 の商",
".   endwhile"],
  fill:{"":"heap[i ÷ 2 の商] ＞ heap[i]"},
  choices:{rows:[["ア","heap[i ÷ 2 の商] ＞ heap[i]"],["イ","heap[i ÷ 2 の商] ＜ heap[i]"],["ウ","heap[2 × i] ＞ heap[i]"],["エ","heap[i － 1] ＞ heap[i]"]]},
  ans:"ア",
  steps:[
  {t:"設問と選択肢を先に見る",h:`<p>while の継続条件の後半です。本体は heap[i] と heap[i ÷ 2 の商]（<b>親</b>）を交換して、i を親に移しています。</p>`},
  {t:"選択肢どうしの違いを見る",h:`<p>比べる相手が親（i÷2）か、子（2i）か、隣（i－1）か。本体で交換している相手が親なので、<span class="mk">比べる相手も親</span>です。残るのはアとイで、違いは不等号の向きです。</p>`},
  {t:"目的を1行でつかむ",h:`<p class="mk">親より小さい間、親と入れ替えて上へ上がる。</p><p>最小ヒープなので「親 ≦ 子」が正しい状態です。親 ＞ 自分 のときに直します。</p>`},
  {t:"空欄の周りだけ読む",map:true,h:`<p>heap[i] の子が heap[2i], heap[2i＋1] なので、逆に heap[i] の親は heap[i ÷ 2 の商] です。</p>`},
  {t:"小さい例でトレース",h:`<p>heap ＝ {3, 5, 8} に 1 を追加します。</p>
<div class="tw"><table class="tr"><tr><th>i</th><th>親 heap[i÷2]</th><th>自分</th><th>ア：親 ＞ 自分？</th><th>heap</th></tr>
<tr><td>4</td><td>heap[2] ＝ 5</td><td>1</td><td>真 → 交換</td><td>{3, 1, 8, 5}</td></tr>
<tr><td>2</td><td>heap[1] ＝ 3</td><td>1</td><td>真 → 交換</td><td>{1, 3, 8, 5}</td></tr>
<tr class="em"><td>1</td><td colspan="3">i ＞ 1 が偽で終了</td><td>{1, 3, 8, 5}</td></tr></table></div>`},
  {t:"選択肢を消す",h:`<ul class="elim">
<li class="o"><b>ア</b><span>正解。</span></li>
<li class="x"><b>イ</b><span>最大ヒープ用の条件（大きい値が上がる）。</span></li>
<li class="x"><b>ウ</b><span>子と比べている。本体の交換相手と合わない。</span></li>
<li class="x"><b>エ</b><span>隣の要素は親子関係ではない。</span></li></ul>`}],
  sum:{type:"ヒープ（上方移動）",label:"while ＝「親より小さい間、親と交換」",tip:"条件式で比べる相手と、本体で操作する相手は一致することが多い。本体を先に読んで相手を特定する。"}
},
{ id:"og-8", year:"データ構造", no:8, topic:"ヒープの中身",
  stem:`<p>次の記述中の［　　］に入れる正しい答えを，解答群の中から選べ。ここで，配列の要素番号は 1 から始まる。</p>
<p>データ構造の問題 7 の手続 push を使い，空の heap に 5，3，8，1 の順に値を追加した。その直後の heap の内容は［　　］である。</p>`,
  code:[
".○push(整数型: v)",
".   整数型: i, tmp",
"+   heapの末尾 に v を追加する",
"+   i ← heapの要素数",
"!   while ((i ＞ 1) and (heap[i ÷ 2 の商] ＞ heap[i]))",
"!      tmp ← heap[i]",
"!      heap[i] ← heap[i ÷ 2 の商]",
"!      heap[i ÷ 2 の商] ← tmp",
"!      i ← i ÷ 2 の商",
".   endwhile"],
  choices:{rows:[["ア","{1, 3, 8, 5}"],["イ","{1, 3, 5, 8}"],["ウ","{1, 5, 8, 3}"],["エ","{3, 1, 8, 5}"],["オ","{5, 3, 8, 1}"]]},
  ans:"ア",
  steps:[
  {t:"設問と選択肢を先に見る",h:`<p>4回の push の後の配列です。ヒープは<b>整列済みとは限らない</b>ので、イ（整列済み）は罠の可能性が高いです。</p>`},
  {t:"選択肢どうしの違いを見る",h:`<p>先頭が 1 でないエ・オは最小ヒープの根として不正なので、消えます。残りはア・イ・ウです。</p>`},
  {t:"目的を1行でつかむ",h:`<p class="mk">末尾に足して、親より小さい間は上へ上がる。</p>`},
  {t:"空欄の周りだけ読む",map:true,h:`<p>親の位置は i ÷ 2 の商です（2 と 3 の親は 1、4 の親は 2）。</p>`},
  {t:"小さい例でトレース",h:`<div class="tw"><table class="tr"><tr><th>push</th><th>末尾に追加</th><th>上方移動</th><th>heap</th></tr>
<tr><td>5</td><td>{5}</td><td>なし</td><td>{5}</td></tr>
<tr><td>3</td><td>{5, 3}</td><td>親 5 ＞ 3 → 交換</td><td>{3, 5}</td></tr>
<tr><td>8</td><td>{3, 5, 8}</td><td>親 3 ＜ 8 → なし</td><td>{3, 5, 8}</td></tr>
<tr class="em"><td>1</td><td>{3, 5, 8, 1}</td><td>親 5 と交換 → 親 3 と交換</td><td>{1, 3, 8, 5}</td></tr></table></div>
<p>{1, 3, 8, 5} は、親 1 ≦ 子 3, 8、親 3 ≦ 子 5 で、ヒープの性質を満たしています。整列はされていません。</p>`},
  {t:"選択肢を消す",h:`<ul class="elim">
<li class="o"><b>ア</b><span>正解。</span></li>
<li class="x"><b>イ</b><span>整列した結果。ヒープは整列まではしない。</span></li>
<li class="x"><b>ウ</b><span>1 が上がるときに、5 と 3 の位置がずれている。</span></li>
<li class="x"><b>エ</b><span>1 を親の 3 と交換し忘れている。</span></li>
<li class="x"><b>オ</b><span>入れた順のまま。</span></li></ul>`}],
  sum:{type:"ヒープ（トレース）",label:"push ＝「末尾に足して上へ浮かせる」",tip:"ヒープは「親 ≦ 子」だけを保証し、兄弟の順や全体の整列は保証しない。整列済みの選択肢は疑う。"}
},
{ id:"og-9", year:"データ構造", no:9, topic:"キューで順番に除外",
  stem:`<p>次の記述中の［　　］に入れる正しい答えを，解答群の中から選べ。</p>
<p>次のプログラムは，番号 1〜5 の 5 人をキューに並べ，「先頭の 1 人を末尾に回す → 次の先頭の 1 人を取り除いて出力する」を，キューが空になるまで繰り返す。関数 enqueue と dequeue はキューへの格納と取出しを行い，関数 isEmpty はキューが空なら true を返す。最後に出力される番号は［　　］である。</p>`,
  code:[
".整数型: i",
"+for (i を 1 から 5 まで 1 ずつ増やす)",
"+   enqueue(i)",
".endfor",
"!while (isEmpty() が false)",
"!   enqueue(dequeue())",
"!   dequeue() の戻り値を出力する",
".endwhile"],
  choices:{rows:[["ア","1"],["イ","2"],["ウ","3"],["エ","4"],["オ","5"]]},
  ans:"ウ",
  steps:[
  {t:"設問と選択肢を先に見る",h:`<p>「最後に出力される番号」、つまり最後まで残る人を答えます。</p>`},
  {t:"選択肢どうしの違いを見る",h:`<p>1〜5 のどれか。規則的に見えても、5 は 2 で割り切れないので、周回するとずれが出ます。<span class="mk">キューの中身を毎回書き出すのが確実</span>です。</p>`},
  {t:"目的を1行でつかむ",h:`<p class="mk">1人飛ばして、次の人を抜く。これを輪になって繰り返す。</p><p>「先頭を末尾に回す」ことで、キューを輪として使っています。</p>`},
  {t:"空欄の周りだけ読む",map:true,h:`<p>while の1周で「回す1人」と「抜く1人」が決まります。1人だけ残ったときも、その人を回して（自分の後ろに自分）から抜くので、最後に出力されます。</p>`},
  {t:"小さい例でトレース",h:`<div class="tw"><table class="tr"><tr><th>周</th><th>開始時のキュー（左が先頭）</th><th>回す</th><th>出力</th></tr>
<tr><td>1</td><td>1 2 3 4 5</td><td>1</td><td>2</td></tr>
<tr><td>2</td><td>3 4 5 1</td><td>3</td><td>4</td></tr>
<tr><td>3</td><td>5 1 3</td><td>5</td><td>1</td></tr>
<tr><td>4</td><td>3 5</td><td>3</td><td>5</td></tr>
<tr class="em"><td>5</td><td>3</td><td>3</td><td>3</td></tr></table></div>
<p>出力順は 2, 4, 1, 5, 3 で、最後は <b>3</b> です。</p>`},
  {t:"選択肢を消す",h:`<ul class="elim">
<li class="o"><b>ウ</b><span>正解。</span></li>
<li class="x"><b>エ</b><span>周回の境目で回す・抜くの順番がずれた誤り。</span></li>
<li class="x"><b>その他</b><span>途中で出力される番号。</span></li></ul>`}],
  sum:{type:"キュー（輪の表現）",label:"enqueue(dequeue()) ＝「先頭を末尾へ回す」",tip:"キューは中身を左が先頭の1行で書き、操作ごとに次の行へ書き直す。暗算で周回させない。"}
},
{ id:"og-10", year:"データ構造", no:10, topic:"インスタンスと参照",
  stem:`<p>次の記述中の［　　］に入れる正しい答えを，解答群の中から選べ。</p>
<p>クラス Counter は次のとおり定義されている。ここで，インスタンスを変数に代入すると，インスタンスへの参照が代入される（インスタンスは複製されない）。次のプログラムを実行すると，［　　］の順に出力される。</p>
<div class="box">Counter(整数型: start)：コンストラクタ。メンバ変数 value に start を設定する。<br>inc()：value を 1 増やす。<br>get()：value を返す。</div>`,
  code:[
"+Counter: a ← Counter(1)",
"!Counter: b ← a",
"+b.inc()",
"!b ← Counter(10)",
"+b.inc()",
".a.get() の戻り値を出力する",
".b.get() の戻り値を出力する"],
  choices:{rows:[["ア","1, 11"],["イ","2, 11"],["ウ","2, 2"],["エ","1, 2"],["オ","2, 12"]]},
  ans:"イ",
  steps:[
  {t:"設問と選択肢を先に見る",h:`<p>出力は a.get() と b.get() の2つです。問題文の「<span class="mk">インスタンスは複製されない</span>」が最重要の注記です。</p>`},
  {t:"選択肢どうしの違いを見る",h:`<p>a の値が 1 か 2 か（b.inc() が a に影響するか）、b の値が 11 か 12 か（新しいインスタンスに何回 inc したか）。</p>`},
  {t:"目的を1行でつかむ",h:`<p class="mk">変数は「インスタンスを指す矢印」。b ← a は同じ物を指すだけで、b ← Counter(10) で別の物を指し直す。</p>`},
  {t:"空欄の周りだけ読む",map:true,h:`<p>矢印の向きが変わるのは、黄色の2行（b への代入）だけです。</p>`},
  {t:"小さい例でトレース",h:`<p>インスタンスを ①・② と名前を付けて追います。</p>
<div class="tw"><table class="tr"><tr><th>行</th><th>a が指す</th><th>b が指す</th><th>①.value</th><th>②.value</th></tr>
<tr><td>a ← Counter(1)</td><td>①</td><td>—</td><td>1</td><td></td></tr>
<tr><td>b ← a</td><td>①</td><td>①</td><td>1</td><td></td></tr>
<tr><td>b.inc()</td><td>①</td><td>①</td><td>2</td><td></td></tr>
<tr><td>b ← Counter(10)</td><td>①</td><td>②</td><td>2</td><td>10</td></tr>
<tr class="em"><td>b.inc()</td><td>①</td><td>②</td><td>2</td><td>11</td></tr></table></div>
<p>a.get() ＝ 2、b.get() ＝ 11 です。</p>`},
  {t:"選択肢を消す",h:`<ul class="elim">
<li class="x"><b>ア</b><span>b ← a で複製されると考えた誤り。</span></li>
<li class="o"><b>イ</b><span>正解。</span></li>
<li class="x"><b>ウ</b><span>b ← Counter(10) で ① が書き換わると考えた誤り。</span></li>
<li class="x"><b>エ</b><span>根拠なし。</span></li>
<li class="x"><b>オ</b><span>最初の inc も ② に効くと考えた誤り。</span></li></ul>`}],
  sum:{type:"オブジェクト指向（参照）",label:"変数 ＝「インスタンスへの矢印」",tip:"インスタンスに番号を付け、「どの変数がどれを指すか」の表を書く。代入は矢印の付け替え、メソッド呼び出しは矢印の先を変更。"}
},
{ id:"og-11", year:"データ構造", no:11, topic:"リストの反転",
  stem:`<p>次のプログラム中の［　　］に入れる正しい答えを，解答群の中から選べ。</p>
<p>クラス ListElement は，単方向リストの要素を表し，メンバ変数 val と next を持つ（データ構造の問題 4 と同じ）。大域変数 head は先頭の要素への参照である（ダミーはない）。手続 reverseList は，リストの要素のつながりを逆向きにして，head が元の末尾の要素を参照するようにする。</p>`,
  code:[
".大域: ListElement: head",
".",
".○reverseList()",
"+   ListElement: prev ← 未定義の値",
"+   ListElement: cur ← head",
".   ListElement: nxt",
"+   while (cur が 未定義でない)",
"+      nxt ← cur.next",
"!      [[]]",
"+      prev ← cur",
"+      cur ← nxt",
".   endwhile",
"+   head ← prev"],
  fill:{"":"cur.next ← prev"},
  choices:{rows:[["ア","cur.next ← prev"],["イ","prev.next ← cur"],["ウ","cur.next ← nxt"],["エ","nxt.next ← cur"]]},
  ans:"ア",
  steps:[
  {t:"設問と選択肢を先に見る",h:`<p>ループの中で、つながりの向きを変える1行が空欄です。3つの変数 prev・cur・nxt の役割を押さえます。</p>`},
  {t:"選択肢どうしの違いを見る",h:`<p>どの要素の next を、どこへ向けるか。<span class="mk">1周で向きを変えるのは cur の矢印1本</span>です。</p>`},
  {t:"目的を1行でつかむ",h:`<p class="mk">cur の矢印を、次ではなく前（prev）に向け直し、3人そろって1つ進む。</p><p>nxt は、矢印を向け直す前に「次」を覚えておくための変数です。</p>`},
  {t:"空欄の周りだけ読む",map:true,h:`<p>nxt ← cur.next で次を退避してから、cur.next を書き換えます。書き換えた後も nxt で先に進めます。</p>`},
  {t:"小さい例でトレース",h:`<p>1 → 2 → 3 を反転します。</p>
<div class="tw"><table class="tr"><tr><th>周</th><th>cur</th><th>アの処理</th><th>つながり</th></tr>
<tr><td>1</td><td>1</td><td>1.next ← なし</td><td>1、2 → 3</td></tr>
<tr><td>2</td><td>2</td><td>2.next ← 1</td><td>2 → 1、3</td></tr>
<tr class="em"><td>3</td><td>3</td><td>3.next ← 2</td><td>3 → 2 → 1</td></tr></table></div>
<p>最後に head ← prev（＝ 3）で完成です。</p>`},
  {t:"選択肢を消す",h:`<ul class="elim">
<li class="o"><b>ア</b><span>正解。</span></li>
<li class="x"><b>イ</b><span>1周目は prev が未定義で、prev.next を参照できない。</span></li>
<li class="x"><b>ウ</b><span>元のつながりのまま（何も変わらない）。</span></li>
<li class="x"><b>エ</b><span>最後の周で nxt が未定義になり、参照できない。</span></li></ul>`}],
  sum:{type:"連結リスト（反転）",label:"3つの変数 ＝「前・今・次」",tip:"リスト操作で変数が3つ並んでいたら、それぞれに「前・今・次」のようなラベルを付ける。初回と最終回で未定義を参照しないかも確かめる。"}
},
{ id:"og-12", year:"データ構造", no:12, topic:"チェイン法の比較回数",
  stem:`<p>次の記述中の［　　］に入れる正しい答えを，解答群の中から選べ。</p>
<p>整数をハッシュ表に格納する。ハッシュ値は (値 mod 5) とし，ハッシュ値ごとにリストを持ち，同じハッシュ値の値はそのリストの末尾に追加する（チェイン法）。空のハッシュ表に 12，8，23，18，3，9 の順に格納した後，値 3 を探索する。探索は，3 のハッシュ値のリストを先頭から順に調べ，3 と等しい値が見つかるまで値を比較する。このとき，比較は［　　］回行われる。</p>`,
  code:[
".○論理型: contains(整数型: v)",
"+   リスト: list ← ハッシュ値 (v mod 5) のリスト",
"!   for (x に list の要素を先頭から順に代入する)",
"!      if (x ＝ v)",
".         return true",
".      endif",
".   endfor",
".   return false"],
  choices:{rows:[["ア","1"],["イ","2"],["ウ","3"],["エ","4"],["オ","6"]]},
  ans:"エ",
  steps:[
  {t:"設問と選択肢を先に見る",h:`<p>3 を探すときの比較回数です。調べるのは <b>3 と同じハッシュ値のリストだけ</b>なので、他のリストは関係ありません。</p>`},
  {t:"選択肢どうしの違いを見る",h:`<p>6 は全要素を比べた場合の数です。チェイン法では、同じハッシュ値のものだけを比べます。</p>`},
  {t:"目的を1行でつかむ",h:`<p class="mk">3 mod 5 ＝ 3 のリストを先頭から調べ、何番目に 3 があるかを数える。</p>`},
  {t:"空欄の周りだけ読む",map:true,h:`<p>格納した値のハッシュ値を書き出し、ハッシュ値 3 のものだけを順番に並べます。</p>`},
  {t:"小さい例でトレース",h:`<div class="tw"><table class="tr"><tr><th>値</th><th>mod 5</th></tr>
<tr><td>12</td><td>2</td></tr><tr class="em"><td>8</td><td>3</td></tr><tr class="em"><td>23</td><td>3</td></tr><tr class="em"><td>18</td><td>3</td></tr><tr class="em"><td>3</td><td>3</td></tr><tr><td>9</td><td>4</td></tr></table></div>
<p>ハッシュ値 3 のリストは 8 → 23 → 18 → 3 です。3 は 4 番目なので、比較は <b>4</b> 回です。</p>`},
  {t:"選択肢を消す",h:`<ul class="elim">
<li class="o"><b>エ</b><span>正解。</span></li>
<li class="x"><b>ア</b><span>直接その場所にあると考えた誤り。</span></li>
<li class="x"><b>オ</b><span>全要素を比べている。</span></li>
<li class="x"><b>イ・ウ</b><span>数え漏れ。</span></li></ul>`}],
  sum:{type:"ハッシュ（チェイン法）",label:"list ＝「同じハッシュ値のものだけの列」",tip:"ハッシュは「まず値を全部 mod した表を作る」。衝突が多いと探索が遅くなる点もよく問われる。"}
}
]);
