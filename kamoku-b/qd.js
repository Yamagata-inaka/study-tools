window.PX = (window.PX || []).concat([
{ id:"od-1", year:"再帰", no:1, topic:"1つおきの積",
  stem:`<p>次の記述中の［　　］に入れる正しい答えを，解答群の中から選べ。</p>
<p>関数 f を f(7) として呼び出すと，戻り値は［　　］となる。</p>`,
  code:[
".○整数型: f(整数型: n)",
"!   if (n ≦ 1)",
"!      return 1",
".   endif",
"!   return n × f(n － 2)"],
  choices:{rows:[["ア","15"],["イ","35"],["ウ","48"],["エ","105"],["オ","5040"]]},
  ans:"エ",
  steps:[
  {t:"設問と選択肢を先に見る",h:`<p>再帰関数の戻り値を求めます。5040 ＝ 7!（普通の階乗）は「n－1」と見間違えたときの罠です。</p>`},
  {t:"選択肢どうしの違いを見る",h:`<p>105 ＝ 7×5×3×1、48 ＝ 6×4×2、35 ＝ 7×5、15 ＝ 5×3。<span class="mk">どこで止まるか（終了条件）</span>で答えが変わります。</p>`},
  {t:"目的を1行でつかむ",h:`<p class="mk">n から 2 ずつ減らしながら掛けていき、1 以下で止める。</p>`},
  {t:"空欄の周りだけ読む",map:true,h:`<p>再帰は<b>呼び出しを縦に書き出す</b>と追いやすくなります。戻り値は下から上へ計算します。</p>`},
  {t:"小さい例でトレース",h:`<div class="code"><span class="ln">f(7) ＝ 7 × f(5)              ＝ 7 × 15 ＝ 105</span><span class="ln">       f(5) ＝ 5 × f(3)       ＝ 5 × 3  ＝ 15</span><span class="ln">              f(3) ＝ 3 × f(1) ＝ 3 × 1  ＝ 3</span><span class="ln">                     f(1) ＝ 1（n ≦ 1）</span></div>`},
  {t:"選択肢を消す",h:`<ul class="elim">
<li class="o"><b>エ</b><span>正解。</span></li>
<li class="x"><b>オ</b><span>n－1 ずつ減らす普通の階乗。</span></li>
<li class="x"><b>イ</b><span>f(3) で止めたことになる。</span></li>
<li class="x"><b>ア・ウ</b><span>開始値の読み違い。</span></li></ul>`}],
  sum:{type:"再帰（線形）",label:"f ＝「2 つおきに掛ける」",tip:"再帰は呼び出しを字下げして縦に書き、一番下（終了条件）から上へ値を戻していく。"}
},
{ id:"od-2", year:"再帰", no:2, topic:"呼び出し回数",
  stem:`<p>次の記述中の［　　］に入れる正しい答えを，解答群の中から選べ。</p>
<p>関数 fib を fib(5) として呼び出したとき，関数 fib が呼び出される回数は，最初の呼び出しを含めて［　　］回である。</p>`,
  code:[
".○整数型: fib(整数型: n)",
"+   if (n ≦ 2)",
"+      return 1",
".   endif",
"!   return fib(n － 1) ＋ fib(n － 2)"],
  choices:{rows:[["ア","5"],["イ","8"],["ウ","9"],["エ","15"],["オ","25"]]},
  ans:"ウ",
  steps:[
  {t:"設問と選択肢を先に見る",h:`<p>戻り値ではなく<b>呼び出し回数</b>を問われています。fib(5) の値は 5 ですが、それはアの罠です。</p>`},
  {t:"選択肢どうしの違いを見る",h:`<p>1回の呼び出しから2回呼び出すので、回数は木の形に増えます。<span class="mk">木を描いて節の数を数えます</span>。</p>`},
  {t:"目的を1行でつかむ",h:`<p class="mk">n が 3 以上なら fib(n－1) と fib(n－2) を両方呼ぶ。2 以下なら呼ばずに 1 を返す。</p>`},
  {t:"空欄の周りだけ読む",map:true,h:`<p>回数を C(n) とすると、C(n) ＝ 1 ＋ C(n－1) ＋ C(n－2)、C(1) ＝ C(2) ＝ 1 です。木を描いても、この式で小さい方から積み上げても同じ答えになります。</p>`},
  {t:"小さい例でトレース",h:`<div class="code"><span class="ln">fib(5)</span><span class="ln">├ fib(4)</span><span class="ln">│ ├ fib(3)</span><span class="ln">│ │ ├ fib(2)</span><span class="ln">│ │ └ fib(1)</span><span class="ln">│ └ fib(2)</span><span class="ln">└ fib(3)</span><span class="ln">  ├ fib(2)</span><span class="ln">  └ fib(1)</span></div>
<p>節は全部で <b>9</b> 個です。式で積み上げると C(3) ＝ 1＋1＋1 ＝ 3、C(4) ＝ 1＋3＋1 ＝ 5、C(5) ＝ 1＋5＋3 ＝ 9 です。</p>`},
  {t:"選択肢を消す",h:`<ul class="elim">
<li class="o"><b>ウ</b><span>正解。</span></li>
<li class="x"><b>ア</b><span>fib(5) の戻り値。</span></li>
<li class="x"><b>イ</b><span>最初の呼び出しを数えていない。</span></li>
<li class="x"><b>エ・オ</b><span>終了条件を n ≦ 1 と読み違えたなどの誤り。</span></li></ul>`}],
  sum:{type:"再帰（木の形）",label:"fib ＝「2つに枝分かれする」",tip:"呼び出し回数は木を描いて節を数える。大きければ C(n) ＝ 1 ＋ C(n－1) ＋ C(n－2) のような式で小さい方から積み上げる。"}
},
{ id:"od-3", year:"再帰", no:3, topic:"ハノイの塔",
  stem:`<p>次の記述中の［　　］に入れる正しい答えを，解答群の中から選べ。</p>
<p>手続 hanoi は，ハノイの塔の円盤の移動手順を出力する。hanoi(n, from, to, via) は，棒 from に積まれた n 枚の円盤を，棒 via を経由して棒 to に移す手順を，1 回の移動ごとに “移動元→移動先” の形で出力する。hanoi(3, "A", "C", "B") として呼び出したとき，3 番目に出力されるのは［　　］である。</p>`,
  code:[
".○hanoi(整数型: n, 文字型: from, 文字型: to, 文字型: via)",
"+   if (n ＞ 0)",
"!      hanoi(n － 1, from, via, to)",
"+      from と to を “→” でつないで出力する",
"!      hanoi(n － 1, via, to, from)",
".   endif"],
  choices:{rows:[["ア","A→B"],["イ","A→C"],["ウ","B→C"],["エ","C→B"],["オ","B→A"]]},
  ans:"エ",
  steps:[
  {t:"設問と選択肢を先に見る",h:`<p>全部の手順（7 手）ではなく、<b>3 番目だけ</b>を問われています。前半だけ展開すれば足ります。</p>`},
  {t:"選択肢どうしの違いを見る",h:`<p>選択肢は棒の組合せです。<span class="mk">再帰呼び出しで引数の役割（from・to・via）が入れ替わる</span>のを正しく追えるかが勝負です。</p>`},
  {t:"目的を1行でつかむ",h:`<p class="mk">上の n－1 枚を via に逃がす → 一番下を to に移す → n－1 枚を via から to へ。</p><p>1つ目の再帰呼び出しの出力が、手順の前半になります。</p>`},
  {t:"空欄の周りだけ読む",map:true,h:`<p>3 番目の出力は、hanoi(3,…) の1つ目の呼び出し hanoi(2, A, B, C)（3 手）の最後の1手です。そこだけ展開します。</p>`},
  {t:"小さい例でトレース",h:`<p>引数を (n, from, to, via) の順に書きます。</p>
<div class="code"><span class="ln">hanoi(3, A, C, B)</span><span class="ln">├ hanoi(2, A, B, C)          ← 3 手</span><span class="ln">│ ├ hanoi(1, A, C, B)</span><span class="ln">│ │ └ 出力 ① A→C</span><span class="ln">│ ├ 出力 ② A→B</span><span class="ln">│ └ hanoi(1, C, B, A)</span><span class="ln">│   └ 出力 ③ C→B</span><span class="ln">├ 出力 ④ A→C</span><span class="ln">└ hanoi(2, B, C, A) …</span></div>
<p>3 番目は <b>C→B</b> です。hanoi(1, …) は「n－1 ＝ 0 の呼び出し（何もしない）→ 出力 → 何もしない」なので、出力1回だけになります。</p>`},
  {t:"選択肢を消す",h:`<ul class="elim">
<li class="o"><b>エ</b><span>正解。</span></li>
<li class="x"><b>イ</b><span>1 番目（と 4 番目）の出力。</span></li>
<li class="x"><b>ア</b><span>2 番目の出力。</span></li>
<li class="x"><b>ウ・オ</b><span>後半の手順。</span></li></ul>`}],
  sum:{type:"再帰（引数の入れ替え）",label:"1つ目の呼び出し ＝「上の山を退避」",tip:"引数の役割が入れ替わる再帰は、呼び出しごとに引数を全部書き写す。求める出力の番号までで展開を止める。"}
},
{ id:"od-4", year:"再帰", no:4, topic:"出力の並び",
  stem:`<p>次の記述中の［　　］に入れる正しい答えを，解答群の中から選べ。</p>
<p>手続 p を p(3) として呼び出すと，［　　］の順に出力される。</p>`,
  code:[
".○p(整数型: n)",
"+   if (n ＞ 0)",
"!      p(n － 1)",
"!      n を出力する",
"!      p(n － 1)",
".   endif"],
  choices:{rows:[["ア","1, 2, 1, 3, 1, 2, 1"],["イ","3, 2, 1, 1, 2, 1, 1"],["ウ","1, 2, 3"],["エ","3, 2, 1, 2, 3"],["オ","1, 1, 2, 1, 1, 2, 3"]]},
  ans:"ア",
  steps:[
  {t:"設問と選択肢を先に見る",h:`<p>出力の並びを答えます。出力は再帰呼び出しの<b>間</b>にあるので、順番に注意が必要です。</p>`},
  {t:"選択肢どうしの違いを見る",h:`<p>先頭が 1 か 3 か、全部で何個か。<span class="mk">最初に出力されるのは、一番深く潜ったところ</span>なので、先頭は 1 です。これでア・ウ・オに絞れます。</p>`},
  {t:"目的を1行でつかむ",h:`<p class="mk">p(n) の出力 ＝ p(n－1) の出力、n、p(n－1) の出力。</p><p>小さい方から組み立てると早いです。</p>`},
  {t:"空欄の周りだけ読む",map:true,h:`<p>p(0) は何も出力しません。</p>
<div class="tw"><table class="tr"><tr><th>呼び出し</th><th>出力</th></tr>
<tr><td>p(1)</td><td>(なし), 1, (なし) → 1</td></tr>
<tr><td>p(2)</td><td>1, 2, 1</td></tr>
<tr class="em"><td>p(3)</td><td>1, 2, 1, 3, 1, 2, 1</td></tr></table></div>`},
  {t:"小さい例でトレース",h:`<p>個数でも確かめます。p(n) の出力の個数を K(n) とすると K(n) ＝ 2K(n－1) ＋ 1 で、K(1) ＝ 1、K(2) ＝ 3、K(3) ＝ 7 です。7 個の選択肢はアとイとオだけで、先頭が 1 なのはアとオです。</p>`},
  {t:"選択肢を消す",h:`<ul class="elim">
<li class="o"><b>ア</b><span>正解。</span></li>
<li class="x"><b>イ</b><span>出力を呼び出しの前に置いた場合の形に近い（先頭が 3）。</span></li>
<li class="x"><b>ウ</b><span>2つ目の再帰呼び出しを無視している。</span></li>
<li class="x"><b>エ</b><span>根拠なし。</span></li>
<li class="x"><b>オ</b><span>出力を2つの呼び出しの後に置いた場合の形。</span></li></ul>`}],
  sum:{type:"再帰（出力の位置）",label:"p(n) ＝「p(n－1)・n・p(n－1)」",tip:"再帰の出力順は、p(1), p(2), … と小さい方から組み立てると速い。個数の式も検算に使える。"}
},
{ id:"od-5", year:"再帰", no:5, topic:"組合せの数",
  stem:`<p>次のプログラム中の［　　］に入れる正しい答えを，解答群の中から選べ。</p>
<p>関数 comb は，0 ≦ r ≦ n である整数 n，r を受け取り，n 個から r 個を選ぶ組合せの数 <sub>n</sub>C<sub>r</sub> を返す。プログラムは <sub>n</sub>C<sub>r</sub> ＝ <sub>n－1</sub>C<sub>r－1</sub> ＋ <sub>n－1</sub>C<sub>r</sub> という関係を利用している。</p>`,
  code:[
".○整数型: comb(整数型: n, 整数型: r)",
"!   if ([[]])",
"+      return 1",
".   endif",
"+   return comb(n － 1, r － 1) ＋ comb(n － 1, r)"],
  fill:{"":"(r ＝ 0) or (r ＝ n)"},
  choices:{rows:[["ア","(r ＝ 0) or (r ＝ n)"],["イ","(r ＝ 0) and (r ＝ n)"],["ウ","n ＝ 0"],["エ","r ＝ 1"],["オ","n ＝ r ＋ 1"]]},
  ans:"ア",
  steps:[
  {t:"設問と選択肢を先に見る",h:`<p>再帰の<b>終了条件</b>が空欄です。終了条件の役目は「これ以上分けられないところで止めること」と「r が負や n より大きくなるのを防ぐこと」です。</p>`},
  {t:"選択肢どうしの違いを見る",h:`<p>and と or の違い（ア・イ）が中心です。r ＝ 0 と r ＝ n が同時に成り立つのは n ＝ r ＝ 0 のときだけです。</p>`},
  {t:"目的を1行でつかむ",h:`<p class="mk">「1つも選ばない」「全部選ぶ」はどちらも 1 通り。それ以外は2つに分けて足す。</p><p>再帰の式は、r を1減らす方向と n だけを減らす方向に進みます。r ＝ 0 の端と r ＝ n の端の<b>両方</b>で止めないと、範囲外（r ＜ 0 や r ＞ n）に進んでしまいます。</p>`},
  {t:"空欄の周りだけ読む",map:true,h:`<p>読むのは終了条件と再帰の式の2か所だけです。</p>`},
  {t:"小さい例でトレース",h:`<p>comb(4, 2)（答えは 6）をアで展開します。</p>
<div class="code"><span class="ln">comb(4,2) ＝ comb(3,1) ＋ comb(3,2)</span><span class="ln">comb(3,1) ＝ comb(2,0) ＋ comb(2,1) ＝ 1 ＋ 2 ＝ 3</span><span class="ln">  comb(2,1) ＝ comb(1,0) ＋ comb(1,1) ＝ 1 ＋ 1 ＝ 2</span><span class="ln">comb(3,2) ＝ comb(2,1) ＋ comb(2,2) ＝ 2 ＋ 1 ＝ 3</span><span class="ln">合計 6</span></div>
<p>イだと comb(2,0) で止まらず comb(1,－1) に進み、r が負のまま止まらなくなります。</p>`},
  {t:"選択肢を消す",h:`<ul class="elim">
<li class="o"><b>ア</b><span>正解。</span></li>
<li class="x"><b>イ</b><span>ほとんど止まらず、r が範囲外に進む。</span></li>
<li class="x"><b>ウ</b><span>r ＝ 0 の端で止まらない。</span></li>
<li class="x"><b>エ</b><span>₃C₁ ＝ 3 なのに 1 を返す。</span></li>
<li class="x"><b>オ</b><span>値も止まる場所も合わない。</span></li></ul>`}],
  sum:{type:"再帰（終了条件）",label:"if ＝「端（0 個・全部）で止める」",tip:"再帰の式が2方向に進むなら、終了条件も両方の端に必要。and と or で迷ったら「両方同時に成り立つのはいつか」を考える。"}
},
{ id:"od-6", year:"再帰", no:6, topic:"再帰による2進数出力",
  stem:`<p>次の記述中の［　　］に入れる正しい答えを，解答群の中から選べ。</p>
<p>手続 printBin を printBin(11) として呼び出すと，［　　］の順に数字が出力される。</p>`,
  code:[
".○printBin(整数型: n)",
"!   if (n ≧ 2)",
"!      printBin(n ÷ 2 の商)",
".   endif",
"!   n mod 2 を出力する"],
  choices:{rows:[["ア","1, 0, 1, 1"],["イ","1, 1, 0, 1"],["ウ","1, 1, 0, 1, 0"],["エ","0, 1, 1, 1"]]},
  ans:"ア",
  steps:[
  {t:"設問と選択肢を先に見る",h:`<p>出力される数字の順番です。出力が<b>再帰呼び出しの後</b>にある点に注目します。</p>`},
  {t:"選択肢どうしの違いを見る",h:`<p>アとイは並びが逆です。11 を2進数にすると 1011 です。<span class="mk">上の桁から出るか下の桁から出るか</span>を決めます。</p>`},
  {t:"目的を1行でつかむ",h:`<p class="mk">先に上の桁（n ÷ 2 の商）を全部出してから、自分の桁（n mod 2）を出す。</p><p>出力が再帰の後なので、一番深い呼び出し（最上位の桁）から順に出力されます。</p>`},
  {t:"空欄の周りだけ読む",map:true,h:`<p>呼び出しを潜っていき、戻るときに出力します。</p>`},
  {t:"小さい例でトレース",h:`<div class="tw"><table class="tr"><tr><th>呼び出し</th><th>n mod 2</th><th>出力の順番</th></tr>
<tr><td>printBin(11)</td><td>1</td><td>4番目</td></tr>
<tr><td>printBin(5)</td><td>1</td><td>3番目</td></tr>
<tr><td>printBin(2)</td><td>0</td><td>2番目</td></tr>
<tr class="em"><td>printBin(1)（n ≧ 2 が偽）</td><td>1</td><td>1番目</td></tr></table></div>
<p>出力は 1, 0, 1, 1 で、11 の2進数 1011 と一致します。</p>`},
  {t:"選択肢を消す",h:`<ul class="elim">
<li class="o"><b>ア</b><span>正解。</span></li>
<li class="x"><b>イ</b><span>出力が再帰呼び出しの前にある場合（下の桁から出る）。</span></li>
<li class="x"><b>ウ</b><span>呼び出しが1回多い。</span></li>
<li class="x"><b>エ</b><span>根拠なし。</span></li></ul>`}],
  sum:{type:"再帰（戻りがけの処理）",label:"出力 ＝「戻りがけに自分の桁」",tip:"再帰呼び出しの後にある処理は、深い方から順に実行される（戻りがけ）。前にある処理は浅い方から（行きがけ）。"}
},
{ id:"od-7", year:"再帰", no:7, topic:"べき乗の再帰",
  stem:`<p>次の記述中の［　　］に入れる正しい答えを，解答群の中から選べ。</p>
<p>関数 pow は，整数 x と 0 以上の整数 n を受け取り，x の n 乗を返す。関数 pow を pow(3, 10) として呼び出したとき，関数 pow が呼び出される回数は，最初の呼び出しを含めて［　　］回である。</p>`,
  code:[
".○整数型: pow(整数型: x, 整数型: n)",
".   整数型: h",
"+   if (n ＝ 0)",
"+      return 1",
".   endif",
"!   h ← pow(x, n ÷ 2 の商)",
".   if ((n mod 2) ＝ 0)",
".      return h × h",
".   else",
".      return h × h × x",
".   endif"],
  choices:{rows:[["ア","3"],["イ","4"],["ウ","5"],["エ","10"],["オ","11"]]},
  ans:"ウ",
  steps:[
  {t:"設問と選択肢を先に見る",h:`<p>呼び出し回数を問われています。1回の呼び出しの中で再帰呼び出しは<b>1回だけ</b>なので、木にはならず一直線です。</p>`},
  {t:"選択肢どうしの違いを見る",h:`<p>10・11 は「n を1ずつ減らす」と誤解した場合の値です。このプログラムは n を半分にしていきます。</p>`},
  {t:"目的を1行でつかむ",h:`<p class="mk">x<sup>n</sup> ＝ (x<sup>n÷2</sup>)<sup>2</sup>（n が奇数ならさらに × x）。</p><p>h を一度計算して2回使うのがポイントです。pow(x, n÷2) を2回呼ぶ書き方だと、回数は大きく増えます。</p>`},
  {t:"空欄の周りだけ読む",map:true,h:`<p>回数に関係するのは h ← pow(…) の行と、終了条件だけです。return の式は回数に関係しません。</p>`},
  {t:"小さい例でトレース",h:`<div class="tw"><table class="tr"><tr><th>回</th><th>呼び出し</th></tr>
<tr><td>1</td><td>pow(3, 10)</td></tr><tr><td>2</td><td>pow(3, 5)</td></tr><tr><td>3</td><td>pow(3, 2)</td></tr><tr><td>4</td><td>pow(3, 1)</td></tr>
<tr class="em"><td>5</td><td>pow(3, 0) → 1 を返す</td></tr></table></div>
<p>n は 10 → 5 → 2 → 1 → 0 で <b>5 回</b>です。pow(3, 1) も 1 ÷ 2 の商 ＝ 0 で、もう1回呼ぶ点を忘れないでください。</p>`},
  {t:"選択肢を消す",h:`<ul class="elim">
<li class="o"><b>ウ</b><span>正解。</span></li>
<li class="x"><b>イ</b><span>pow(3, 0) の呼び出しを数え忘れている。</span></li>
<li class="x"><b>エ・オ</b><span>n を1ずつ減らす再帰と誤解している。</span></li>
<li class="x"><b>ア</b><span>数え漏れ。</span></li></ul>`}],
  sum:{type:"再帰（分割統治）",label:"h ← pow(x, n÷2) ＝「半分の問題を1回だけ解く」",tip:"再帰の回数は、引数がどう変化するかを列にして書けば数えられる。終了条件の呼び出し（n ＝ 0）も1回に数える。"}
}
]);
