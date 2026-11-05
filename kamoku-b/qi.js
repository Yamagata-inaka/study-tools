window.PX = (window.PX || []).concat([
{ id:"oi-1", year:"応用・オブジェクト指向", no:1, topic:"口座クラス",
  stem:`<p>次の記述中の［　　］に入れる正しい答えを，解答群の中から選べ。</p>
<p>クラス Account は銀行口座を表す。メンバ変数 balance は残高である。次のプログラムを実行すると，［　　］の順に出力される。</p>
<div class="box">Account(整数型: b)：コンストラクタ。balance に b を設定する。<br>deposit(整数型: x)：balance を x 増やす。<br>withdraw(整数型: x)：balance が x 未満なら何もせず false を返す。そうでなければ balance を x 減らして true を返す。</div>`,
  code:[
"+Account: a ← Account(1000)",
"+a.withdraw(300)",
"+a.deposit(500)",
"!if (a.withdraw(1500) が true)",
"!   \"OK\" を出力する",
"!else",
"!   \"NG\" を出力する",
".endif",
"+a.withdraw(1200)",
".a.balance を出力する"],
  choices:{rows:[["ア","\"NG\"，0"],["イ","\"OK\"，－300"],["ウ","\"NG\"，1200"],["エ","\"OK\"，0"],["オ","\"NG\"，－1200"]]},
  ans:"ア",
  steps:[
  {t:"設問と選択肢を先に見る",h:`<p>出力は2つ（OK／NG と最後の残高）です。<b>withdraw は失敗すると何もしない</b>点が鍵です。</p>`},
  {t:"選択肢どうしの違いを見る",h:`<p>1500 の引出しが成功するか、そして最後の 1200 の引出しが成功するか。<span class="mk">残高を1行ずつ書いていけば</span>迷いません。</p>`},
  {t:"目的を1行でつかむ",h:`<p class="mk">残高が足りるときだけ引き出せる口座。</p>`},
  {t:"空欄の周りだけ読む",map:true,h:`<p>if の条件の中で a.withdraw(1500) が<b>実行される</b>ことに注意します。成功すれば残高が減り、失敗すれば変わりません。</p>`},
  {t:"小さい例でトレース",h:`<div class="tw"><table class="tr"><tr><th>行</th><th>結果</th><th>balance</th></tr>
<tr><td>Account(1000)</td><td></td><td>1000</td></tr>
<tr><td>withdraw(300)</td><td>true</td><td>700</td></tr>
<tr><td>deposit(500)</td><td></td><td>1200</td></tr>
<tr><td>withdraw(1500)</td><td>1200 ＜ 1500 → false → "NG"</td><td>1200</td></tr>
<tr class="em"><td>withdraw(1200)</td><td>true</td><td>0</td></tr></table></div>`},
  {t:"選択肢を消す",h:`<ul class="elim">
<li class="o"><b>ア</b><span>正解。</span></li>
<li class="x"><b>イ</b><span>残高不足でも引き出せると誤解している。</span></li>
<li class="x"><b>ウ</b><span>最後の withdraw(1200) が失敗すると誤解している（1200 未満ではない）。</span></li>
<li class="x"><b>エ・オ</b><span>途中の扱いを誤っている。</span></li></ul>`}],
  sum:{type:"オブジェクト指向（メソッドの副作用）",label:"withdraw ＝「足りるときだけ減らす」",tip:"if の条件にメソッド呼び出しがあると、判定と同時に状態が変わる。条件式の中でも処理は実行される。"}
},
{ id:"oi-2", year:"応用・オブジェクト指向", no:2, topic:"硬貨の最少枚数",
  stem:`<p>次の記述中の［　　］に入れる正しい答えを，解答群の中から選べ。ここで，配列 dp の要素番号は 0 から始まり，配列 coins の要素番号は 1 から始まる。</p>
<p>関数 minCoins は，硬貨の種類を表す整数型の配列 coins と金額 amount を受け取り，ちょうど amount にするのに必要な硬貨の最少枚数を返す。各硬貨は何枚でも使える。minCoins({1, 4, 6}, 8) の戻り値は［　　］である。</p>`,
  code:[
".○整数型: minCoins(整数型の配列: coins, 整数型: amount)",
"+   整数型の配列: dp ← {(amount ＋ 1)個の ∞}  // dp[0]〜dp[amount]",
".   整数型: a, i, c",
"+   dp[0] ← 0",
"+   for (a を 1 から amount まで 1 ずつ増やす)",
"+      for (i を 1 から coinsの要素数 まで 1 ずつ増やす)",
"+         c ← coins[i]",
"!         if ((c ≦ a) and (dp[a － c] ＋ 1 ＜ dp[a]))",
"!            dp[a] ← dp[a － c] ＋ 1",
".         endif",
".      endfor",
".   endfor",
".   return dp[amount]"],
  choices:{rows:[["ア","2"],["イ","3"],["ウ","4"],["エ","8"]]},
  ans:"ア",
  steps:[
  {t:"設問と選択肢を先に見る",h:`<p>8 円を 1・4・6 円玉で作る最少枚数です。暗算でも分かりますが、<b>「大きい硬貨から使う」と間違える</b>のがこの問題の罠です。</p>`},
  {t:"選択肢どうしの違いを見る",h:`<p>大きい順に使うと 6＋1＋1 で 3 枚（イ）です。しかし 4＋4 なら 2 枚です。<span class="mk">このプログラムが大きい順の方法ではなく、全部の組合せを考える方法か</span>を確かめます。</p>`},
  {t:"目的を1行でつかむ",h:`<p class="mk">dp[a] ＝ a 円を作る最少枚数。最後に使う硬貨 c を全部試し、dp[a－c] ＋ 1 の最小を取る。</p><p>小さい金額の答えを表にためて、大きい金額の答えに使う方法（動的計画法）です。</p>`},
  {t:"空欄の周りだけ読む",map:true,h:`<p>if は「c 円玉を最後に1枚使う方が、今の記録より少なければ更新」という意味です。</p>`},
  {t:"小さい例でトレース",h:`<div class="tw"><table class="tr"><tr><th>a</th><th>c＝1 から</th><th>c＝4 から</th><th>c＝6 から</th><th>dp[a]</th></tr>
<tr><td>1</td><td>dp[0]＋1 ＝ 1</td><td>—</td><td>—</td><td>1</td></tr>
<tr><td>2</td><td>2</td><td>—</td><td>—</td><td>2</td></tr>
<tr><td>3</td><td>3</td><td>—</td><td>—</td><td>3</td></tr>
<tr><td>4</td><td>4</td><td>dp[0]＋1 ＝ 1</td><td>—</td><td>1</td></tr>
<tr><td>5</td><td>2</td><td>dp[1]＋1 ＝ 2</td><td>—</td><td>2</td></tr>
<tr><td>6</td><td>3</td><td>dp[2]＋1 ＝ 3</td><td>dp[0]＋1 ＝ 1</td><td>1</td></tr>
<tr><td>7</td><td>2</td><td>dp[3]＋1 ＝ 4</td><td>dp[1]＋1 ＝ 2</td><td>2</td></tr>
<tr class="em"><td>8</td><td>3</td><td>dp[4]＋1 ＝ 2</td><td>dp[2]＋1 ＝ 3</td><td>2</td></tr></table></div>`},
  {t:"選択肢を消す",h:`<ul class="elim">
<li class="o"><b>ア</b><span>正解（4 ＋ 4）。</span></li>
<li class="x"><b>イ</b><span>大きい硬貨から使う方法（6 ＋ 1 ＋ 1）の枚数。</span></li>
<li class="x"><b>ウ</b><span>根拠なし。</span></li>
<li class="x"><b>エ</b><span>1 円玉だけの枚数。</span></li></ul>`}],
  sum:{type:"動的計画法",label:"dp[a] ＝「a 円の最少枚数」",tip:"dp 配列は「dp[a] は何を表すか」を1行で書いてから、小さい a から表を埋める。大きい順に使う（貪欲法）が正しくない例が狙われる。"}
},
{ id:"oi-3", year:"応用・オブジェクト指向", no:3, topic:"経路の数",
  stem:`<p>次のプログラム中の［　　］に入れる正しい答えを，解答群の中から選べ。ここで，配列の要素番号は 1 から始まる。</p>
<p>関数 countPaths は，h 行 w 列の格子の左上のマス (1, 1) から右下のマス (h, w) まで，右又は下に1マスずつ進むときの経路の数を返す。例えば，h ＝ 2，w ＝ 2 のとき 2 を返す。</p>`,
  code:[
".○整数型: countPaths(整数型: h, 整数型: w)",
"+   整数型の二次元配列: dp ← {h行w列の 1}",
".   整数型: r, c",
"+   for (r を 2 から h まで 1 ずつ増やす)",
"+      for (c を 2 から w まで 1 ずつ増やす)",
"!         dp[r, c] ← [[]]",
".      endfor",
".   endfor",
".   return dp[h, w]"],
  fill:{"":"dp[r － 1, c] ＋ dp[r, c － 1]"},
  choices:{rows:[["ア","dp[r － 1, c] ＋ dp[r, c － 1]"],["イ","dp[r － 1, c － 1] ＋ 1"],["ウ","dp[r － 1, c] × dp[r, c － 1]"],["エ","dp[r － 1, c] ＋ dp[r, c － 1] ＋ 1"]]},
  ans:"ア",
  steps:[
  {t:"設問と選択肢を先に見る",h:`<p>dp[r, c] の計算式が空欄です。dp の初期値が全部 1 なのは、<b>1行目と1列目は「まっすぐ進むだけ」の1通り</b>だからです。</p>`},
  {t:"選択肢どうしの違いを見る",h:`<p>上と左を足す（ア）、掛ける（ウ）、さらに ＋1（エ）、斜めから（イ）。<span class="mk">マス (r, c) に入ってくる直前の位置</span>を考えれば決まります。</p>`},
  {t:"目的を1行でつかむ",h:`<p class="mk">dp[r, c] ＝ (r, c) に行く経路の数 ＝ 上から来る数 ＋ 左から来る数。</p>`},
  {t:"空欄の周りだけ読む",map:true,h:`<p>右か下にしか進めないので、(r, c) の直前は (r－1, c)（上）か (r, c－1)（左）のどちらかです。それぞれの経路の数を足します。</p>`},
  {t:"小さい例でトレース",h:`<p>3 行 4 列で表を埋めます（答えは ₅C₂ ＝ 10）。</p>
<div class="tw"><table class="tr"><tr><th></th><th>1</th><th>2</th><th>3</th><th>4</th></tr>
<tr><th>1</th><td>1</td><td>1</td><td>1</td><td>1</td></tr>
<tr><th>2</th><td>1</td><td>2</td><td>3</td><td>4</td></tr>
<tr class="em"><th>3</th><td>1</td><td>3</td><td>6</td><td>10</td></tr></table></div>
<p>問題文の例（2行2列）では、アは 1＋1 ＝ 2、エは 3、ウは 1 になります。</p>`},
  {t:"選択肢を消す",h:`<ul class="elim">
<li class="o"><b>ア</b><span>正解。</span></li>
<li class="x"><b>イ</b><span>斜めには進めない。</span></li>
<li class="x"><b>ウ</b><span>経路は「どちらか」なので掛けずに足す。2行2列で 1 になる。</span></li>
<li class="x"><b>エ</b><span>余分な 1。2行2列で 3 になる。</span></li></ul>`}],
  sum:{type:"動的計画法（二次元）",label:"dp[r, c] ＝「上から ＋ 左から」",tip:"「どちらか一方」なら足し算、「両方を順に」なら掛け算。問題文の小さい例を1つ入れれば、＋1 の有無も分かる。"}
},
{ id:"oi-4", year:"応用・オブジェクト指向", no:4, topic:"料金計算の誤り",
  stem:`<p>次の記述中の［　　］に入れる正しい答えを，解答群の中から選べ。</p>
<p>ある施設の入場料は，6 歳未満は 0 円，6 歳以上 13 歳未満は 500 円，65 歳以上は 700 円，それ以外は 1000 円である。この料金を返すことを意図して関数 fee を作成したが，誤りがある。fee(4) の戻り値は［　　］である。</p>`,
  code:[
".○整数型: fee(整数型: age)",
"!   if (age ＜ 13)",
"!      return 500",
"+   elseif (age ＜ 6)",
"+      return 0",
".   elseif (age ≧ 65)",
".      return 700",
".   else",
".      return 1000",
".   endif"],
  choices:{rows:[["ア","0"],["イ","500"],["ウ","700"],["エ","1000"]]},
  ans:"イ",
  steps:[
  {t:"設問と選択肢を先に見る",h:`<p>「誤りがある」プログラムの<b>実際の</b>戻り値です。仕様どおりの答え（0 円）は罠です。</p>`},
  {t:"選択肢どうしの違いを見る",h:`<p>4 歳の仕様上の料金は 0 円（ア）です。しかし書かれた条件の順番で答えが変わるかを確かめます。</p>`},
  {t:"目的を1行でつかむ",h:`<p class="mk">if 〜 elseif は上から評価し、最初に真になった枝だけを実行する。</p>`},
  {t:"空欄の周りだけ読む",map:true,h:`<p>age ＝ 4 は 1 つ目の条件 age ＜ 13 で<b>すでに真</b>になります。2 つ目の age ＜ 6 は評価されません。実は、age ＜ 6 を満たす値はすべて age ＜ 13 も満たすので、<span class="mk">2 つ目の枝はどんな入力でも実行されません</span>。</p>`},
  {t:"小さい例でトレース",h:`<div class="tw"><table class="tr"><tr><th>age</th><th>age ＜ 13</th><th>age ＜ 6</th><th>戻り値</th><th>仕様</th></tr>
<tr class="em"><td>4</td><td>真</td><td>（評価しない）</td><td>500</td><td>0</td></tr>
<tr><td>10</td><td>真</td><td></td><td>500</td><td>500</td></tr>
<tr><td>70</td><td>偽</td><td>偽</td><td>700</td><td>700</td></tr></table></div>
<p>直すには、age ＜ 6 の判定を age ＜ 13 より前に置きます。</p>`},
  {t:"選択肢を消す",h:`<ul class="elim">
<li class="x"><b>ア</b><span>仕様どおりの答え。書かれたプログラムではこの枝に来ない。</span></li>
<li class="o"><b>イ</b><span>正解。</span></li>
<li class="x"><b>ウ・エ</b><span>4 歳はこれらの枝に来ない。</span></li></ul>`}],
  sum:{type:"条件分岐（評価の順序）",label:"if の並び ＝「範囲の狭い方を先に」",tip:"範囲の条件を並べるときは、狭い範囲（6 未満）を広い範囲（13 未満）より先に書く。逆だと狭い方の枝は永遠に実行されない。"}
},
{ id:"oi-5", year:"応用・オブジェクト指向", no:5, topic:"窓口の待ち時間",
  stem:`<p>次の記述中の［　　］に入れる正しい答えを，解答群の中から選べ。ここで，配列の要素番号は 1 から始まる。</p>
<p>窓口が 1 つの受付で，客は到着順に処理される。arrive[i] は i 番目の客の到着時刻，service[i] はその客の処理に掛かる時間（単位は分）である。関数 totalWait は，全員の待ち時間（到着から処理開始まで）の合計を返す。関数 max は二つの値のうち大きい方を返す。arrive が {0, 1, 2, 6}，service が {3, 2, 1, 2} のとき，totalWait の戻り値は［　　］である。</p>`,
  code:[
".○整数型: totalWait(整数型の配列: arrive, 整数型の配列: service)",
".   整数型: i, start",
"+   整数型: free ← 0      // 窓口が空く時刻",
"+   整数型: wait ← 0",
"+   for (i を 1 から arriveの要素数 まで 1 ずつ増やす)",
"!      start ← max(arrive[i], free)",
"!      wait ← wait ＋ (start － arrive[i])",
"!      free ← start ＋ service[i]",
".   endfor",
".   return wait"],
  choices:{rows:[["ア","3"],["イ","4"],["ウ","5"],["エ","6"],["オ","8"]]},
  ans:"ウ",
  steps:[
  {t:"設問と選択肢を先に見る",h:`<p>待ち時間の合計です。4 人なので、4 行の表で済みます。</p>`},
  {t:"選択肢どうしの違いを見る",h:`<p>オの 8 は全員の処理が終わる時刻で、待ち時間とは別のものです。</p>`},
  {t:"目的を1行でつかむ",h:`<p class="mk">処理開始 ＝ 到着時刻と窓口が空く時刻の遅い方。待ち ＝ 開始 － 到着。</p>`},
  {t:"空欄の周りだけ読む",map:true,h:`<p>ループ本体の3行にラベルを付けます。</p><ul><li>start：いつ始められるか</li><li>wait：待った分を足す</li><li>free：次に窓口が空く時刻</li></ul>`},
  {t:"小さい例でトレース",h:`<div class="tw"><table class="tr"><tr><th>客</th><th>到着</th><th>free（前）</th><th>開始</th><th>待ち</th><th>free（後）</th></tr>
<tr><td>1</td><td>0</td><td>0</td><td>0</td><td>0</td><td>3</td></tr>
<tr><td>2</td><td>1</td><td>3</td><td>3</td><td>2</td><td>5</td></tr>
<tr><td>3</td><td>2</td><td>5</td><td>5</td><td>3</td><td>6</td></tr>
<tr class="em"><td>4</td><td>6</td><td>6</td><td>6</td><td>0</td><td>8</td></tr></table></div>
<p>待ち時間の合計は 0 ＋ 2 ＋ 3 ＋ 0 ＝ <b>5</b> です。</p>`},
  {t:"選択肢を消す",h:`<ul class="elim">
<li class="o"><b>ウ</b><span>正解。</span></li>
<li class="x"><b>オ</b><span>全員の処理が終わる時刻。</span></li>
<li class="x"><b>ア・イ・エ</b><span>開始時刻の取り違えなど。</span></li></ul>`}],
  sum:{type:"シミュレーション（待ち行列）",label:"free ＝「窓口が次に空く時刻」",tip:"時刻のシミュレーションは「到着・開始・終了」の列を持つ表にする。max(到着, 空く時刻) が典型の形。"}
},
{ id:"oi-6", year:"応用・オブジェクト指向", no:6, topic:"条件に合う商品",
  stem:`<p>次のプログラム中の［　　］に入れる正しい答えを，解答群の中から選べ。ここで，配列の要素番号は 1 から始まる。</p>
<p>クラス Item は商品を表し，メンバ変数 name（文字列型），price（整数型，価格），stock（整数型，在庫数）を持つ。関数 countAffordable は，Item の配列 items と予算 budget を受け取り，在庫があり（在庫数が 1 以上），かつ価格が予算以下の商品の数を返す。</p>`,
  code:[
".○整数型: countAffordable(Itemの配列: items, 整数型: budget)",
".   整数型: i",
"+   整数型: count ← 0",
"+   for (i を 1 から itemsの要素数 まで 1 ずつ増やす)",
"!      if ([[]])",
"+         count ← count ＋ 1",
".      endif",
".   endfor",
".   return count"],
  fill:{"":"(items[i].stock ≧ 1) and (items[i].price ≦ budget)"},
  choices:{rows:[["ア","(items[i].stock ≧ 1) and (items[i].price ≦ budget)"],["イ","(items[i].stock ≧ 1) or (items[i].price ≦ budget)"],["ウ","(items[i].stock ＞ 1) and (items[i].price ＜ budget)"],["エ","(items[i].stock ≧ 1) and (items[i].price ≧ budget)"]]},
  ans:"ア",
  steps:[
  {t:"設問と選択肢を先に見る",h:`<p>商品を数える条件です。問題文の「<span class="mk">在庫があり，かつ価格が予算以下</span>」をそのまま条件式に訳します。</p>`},
  {t:"選択肢どうしの違いを見る",h:`<ul><li>and か or か（「かつ」は and）</li><li>境界：≧ 1 か ＞ 1 か、≦ か ＜ か</li><li>向き：price ≦ budget か ≧ か</li></ul>`},
  {t:"目的を1行でつかむ",h:`<p class="mk">2つの条件の両方を満たす商品だけ数える。</p>`},
  {t:"空欄の周りだけ読む",map:true,h:`<p>「1 以上」は ≧ 1、「予算以下」は ≦ budget です。ウは「在庫 2 以上」「予算未満」になってしまいます。</p>`},
  {t:"小さい例でトレース",h:`<p>budget ＝ 500 として、境界ちょうどの商品で比べます。</p>
<div class="tw"><table class="tr"><tr><th>商品</th><th>price</th><th>stock</th><th>数えるべき？</th><th>ア</th><th>イ</th><th>ウ</th></tr>
<tr><td>P</td><td>500</td><td>1</td><td>○</td><td>○</td><td>○</td><td>× </td></tr>
<tr><td>Q</td><td>300</td><td>0</td><td>×</td><td>×</td><td>○ </td><td>×</td></tr>
<tr class="em"><td>R</td><td>800</td><td>5</td><td>×</td><td>×</td><td>○ </td><td>×</td></tr></table></div>
<p>正しく1個だけ数えるのはアです。</p>`},
  {t:"選択肢を消す",h:`<ul class="elim">
<li class="o"><b>ア</b><span>正解。</span></li>
<li class="x"><b>イ</b><span>どちらか一方でも数えてしまう。</span></li>
<li class="x"><b>ウ</b><span>境界（在庫 1、価格 ＝ 予算）を外してしまう。</span></li>
<li class="x"><b>エ</b><span>予算以上の商品を数える。</span></li></ul>`}],
  sum:{type:"オブジェクトの配列の走査",label:"if ＝「問題文の条件の直訳」",tip:"「かつ」は and、「又は」は or、「以上・以下」は等号あり、「未満・超」は等号なし。境界ちょうどの値で試す。"}
},
{ id:"oi-7", year:"応用・オブジェクト指向", no:7, topic:"式の文字列の合計",
  stem:`<p>次のプログラム中の［　　］に入れる正しい答えを，解答群の中から選べ。</p>
<p>関数 sumExpr は，数字と “＋” だけから成る文字列 s を受け取り，s を足し算の式として計算した値を返す。s は数字で始まり数字で終わり，“＋” が連続することはない。例えば，s が "12＋3＋45" のとき 60 を返す。関数 int は数字 1 文字を受け取り，対応する整数を返す。</p>`,
  code:[
".○整数型: sumExpr(文字列型: s)",
".   整数型: i",
"+   整数型: sum ← 0",
"+   整数型: num ← 0",
"+   for (i を 1 から sの文字数 まで 1 ずつ増やす)",
"+      if (sのi文字目 ＝ \"＋\")",
"+         sum ← sum ＋ num",
"+         num ← 0",
".      else",
"+         num ← num × 10 ＋ int(sのi文字目)",
".      endif",
".   endfor",
"!   [[]]",
".   return sum"],
  fill:{"":"sum ← sum ＋ num"},
  choices:{rows:[["ア","sum ← sum ＋ num"],["イ","num ← 0"],["ウ","sum ← num"],["エ","（何も記述しない）"]]},
  ans:"ア",
  steps:[
  {t:"設問と選択肢を先に見る",h:`<p>ループの後の1文です。ループの後に何かが必要なのは、<b>最後の処理がループ内で終わっていない</b>ときです。</p>`},
  {t:"選択肢どうしの違いを見る",h:`<p>最後の数を足すか（ア）、何もしないか（エ）。<span class="mk">最後の数が sum に入るタイミングがあるか</span>を確かめます。</p>`},
  {t:"目的を1行でつかむ",h:`<p class="mk">数字を読んで num を組み立て、“＋” が来たら sum に足す。</p><p>sum に足すのは “＋” を読んだときだけです。最後の数の後には “＋” がありません。</p>`},
  {t:"空欄の周りだけ読む",map:true,h:`<p>文字列 問3（ランレングス）や 問8 と同じ「最後の塊の後始末」です。</p>`},
  {t:"小さい例でトレース",h:`<div class="tw"><table class="tr"><tr><th>文字</th><th>num</th><th>sum</th></tr>
<tr><td>1, 2</td><td>12</td><td>0</td></tr>
<tr><td>＋</td><td>0</td><td>12</td></tr>
<tr><td>3</td><td>3</td><td>12</td></tr>
<tr><td>＋</td><td>0</td><td>15</td></tr>
<tr><td>4, 5</td><td>45</td><td>15</td></tr>
<tr class="em"><td>（ループ後）</td><td>45</td><td>アで 60</td></tr></table></div>
<p>エだと 15 が返ります。</p>`},
  {t:"選択肢を消す",h:`<ul class="elim">
<li class="o"><b>ア</b><span>正解。</span></li>
<li class="x"><b>イ</b><span>最後の数を捨ててしまう。</span></li>
<li class="x"><b>ウ</b><span>それまでの合計を捨てて、最後の数だけになる。</span></li>
<li class="x"><b>エ</b><span>最後の数（45）が足されない。</span></li></ul>`}],
  sum:{type:"文字列の解析",label:"“＋” の枝 ＝「区切りで確定して足す」",tip:"区切り文字で確定する処理は、最後の要素に区切りがないので、ループ後の後始末が必要。この形は何度も出る。"}
},
{ id:"oi-8", year:"応用・オブジェクト指向", no:8, topic:"周囲8マスの数え上げ",
  stem:`<p>次のプログラム中の［　　］に入れる正しい答えを，解答群の中から選べ。ここで，配列の要素番号は 1 から始まる。</p>
<p>関数 neighbors は，各要素が 0 又は 1 である h 行 w 列の二次元配列 g と，マスの位置 (r, c) を受け取り，(r, c) の周囲 8 マス（上下左右と斜め）のうち値が 1 のマスの数を返す。(r, c) 自身は数えない。g の範囲外のマスは数えない。</p>`,
  code:[
".○整数型: neighbors(整数型の二次元配列: g, 整数型: r, 整数型: c)",
".   整数型: dr, dc, nr, nc",
"+   整数型: cnt ← 0",
"+   for (dr を －1 から 1 まで 1 ずつ増やす)",
"+      for (dc を －1 から 1 まで 1 ずつ増やす)",
"!         if ([[]])",
"+            nr ← r ＋ dr",
"+            nc ← c ＋ dc",
".            if ((1 ≦ nr) and (nr ≦ gの行数) and (1 ≦ nc) and (nc ≦ gの列数))",
".               if (g[nr, nc] ＝ 1)",
".                  cnt ← cnt ＋ 1",
".               endif",
".            endif",
".         endif",
".      endfor",
".   endfor",
".   return cnt"],
  fill:{"":"(dr ≠ 0) or (dc ≠ 0)"},
  choices:{rows:[["ア","(dr ≠ 0) or (dc ≠ 0)"],["イ","(dr ≠ 0) and (dc ≠ 0)"],["ウ","(dr ＝ 0) and (dc ＝ 0)"],["エ","(dr ＝ 0) or (dc ＝ 0)"]]},
  ans:"ア",
  steps:[
  {t:"設問と選択肢を先に見る",h:`<p>dr, dc は −1, 0, 1 の 3×3 ＝ 9 通りです。そのうち<b>自分自身（dr ＝ 0 かつ dc ＝ 0）だけを除く</b>条件を選びます。</p>`},
  {t:"選択肢どうしの違いを見る",h:`<p>and と or、≠ と ＝ の組合せ4つです。<span class="mk">それぞれ9通りのうち何通りが真になるか</span>を数えれば、すぐ決まります。</p>`},
  {t:"目的を1行でつかむ",h:`<p class="mk">9 通りのずらし方のうち、(0, 0) 以外の 8 通りを調べる。</p><p>「(0, 0) ではない」＝「not (dr ＝ 0 and dc ＝ 0)」＝「dr ≠ 0 or dc ≠ 0」（ド・モルガンの法則）。</p>`},
  {t:"空欄の周りだけ読む",map:true,h:`<p>内側の範囲チェックと値のチェックは読み飛ばしてかまいません。9 通りの表で条件の真偽だけを数えます。</p>`},
  {t:"小さい例でトレース",h:`<p>(dr, dc) の 9 通りで、真になる数を数えます。</p>
<div class="tw"><table class="tr"><tr><th>選択肢</th><th>真になる (dr, dc)</th><th>個数</th></tr>
<tr class="em"><td>ア</td><td>(0, 0) 以外すべて</td><td>8 ○</td></tr>
<tr><td>イ</td><td>斜めの4つだけ</td><td>4 ×</td></tr>
<tr><td>ウ</td><td>(0, 0) だけ</td><td>1 ×</td></tr>
<tr><td>エ</td><td>上下左右の4つと (0, 0)</td><td>5 ×</td></tr></table></div>`},
  {t:"選択肢を消す",h:`<ul class="elim">
<li class="o"><b>ア</b><span>正解。</span></li>
<li class="x"><b>イ</b><span>上下左右を数えない（斜めだけ）。</span></li>
<li class="x"><b>ウ</b><span>自分自身だけを見る（逆）。</span></li>
<li class="x"><b>エ</b><span>斜めを数えず、自分自身を数える。</span></li></ul>`}],
  sum:{type:"二次元配列（近傍）",label:"if ＝「自分自身を除く」",tip:"「A かつ B ではない」は「A でない または B でない」（ド・モルガン）。迷ったら全パターンの表で真の数を数える。"}
},
{ id:"oi-9", year:"応用・オブジェクト指向", no:9, topic:"平方根の整数部分",
  stem:`<p>次のプログラム中の［　　］に入れる正しい答えを，解答群の中から選べ。</p>
<p>関数 isqrt は，0 以上の整数 n を受け取り，x × x ≦ n を満たす最大の整数 x を返す。例えば，n が 10 のとき 3 を返す。プログラムは，答えが含まれる範囲 lo 〜 hi を半分ずつ狭めていく方法を用いている。</p>`,
  code:[
".○整数型: isqrt(整数型: n)",
"+   整数型: lo ← 0",
"+   整数型: hi ← n",
".   整数型: mid",
"+   while (lo ＜ hi)",
"!      mid ← [[]]",
"+      if (mid × mid ≦ n)",
"+         lo ← mid",
".      else",
"+         hi ← mid － 1",
".      endif",
".   endwhile",
".   return lo"],
  fill:{"":"(lo ＋ hi ＋ 1) ÷ 2 の商"},
  choices:{rows:[["ア","(lo ＋ hi) ÷ 2 の商"],["イ","(lo ＋ hi ＋ 1) ÷ 2 の商"],["ウ","(lo ＋ hi － 1) ÷ 2 の商"],["エ","hi ÷ 2 の商"]]},
  ans:"イ",
  steps:[
  {t:"設問と選択肢を先に見る",h:`<p>mid の決め方です。どの選択肢も「だいたい真ん中」ですが、<b>ループが必ず終わるか</b>に違いが出ます。</p>`},
  {t:"選択肢どうしの違いを見る",h:`<p>＋1 するか、－1 するか、しないか。<span class="mk">lo ← mid（mid を残す）と組み合わせたとき、範囲が縮まるか</span>を考えます。</p>`},
  {t:"目的を1行でつかむ",h:`<p class="mk">mid が条件を満たせば答えは mid 以上（lo ← mid）、満たさなければ mid 未満（hi ← mid－1）。</p>`},
  {t:"空欄の周りだけ読む",map:true,h:`<p>危ないのは lo と hi が<b>隣り合ったとき</b>（hi ＝ lo ＋ 1）です。mid ＝ lo になると、lo ← mid で何も変わらず、無限ループになります。</p>
<ul><li>ア：(lo ＋ lo ＋ 1) ÷ 2 の商 ＝ lo → 縮まらないことがある</li><li>イ：(lo ＋ lo ＋ 2) ÷ 2 の商 ＝ lo ＋ 1 ＝ hi → 必ず縮まる</li></ul>`},
  {t:"小さい例でトレース",h:`<p>n ＝ 10 で比べます。</p>
<div class="tw"><table class="tr"><tr><th>lo</th><th>hi</th><th>イの mid</th><th>mid²≦10？</th><th>処理</th></tr>
<tr><td>0</td><td>10</td><td>5</td><td>25 偽</td><td>hi ← 4</td></tr>
<tr><td>0</td><td>4</td><td>2</td><td>4 真</td><td>lo ← 2</td></tr>
<tr><td>2</td><td>4</td><td>3</td><td>9 真</td><td>lo ← 3</td></tr>
<tr><td>3</td><td>4</td><td>4</td><td>16 偽</td><td>hi ← 3</td></tr>
<tr class="em"><td>3</td><td>3</td><td colspan="3">終了 → 3</td></tr></table></div>
<p>アでは lo ＝ 3、hi ＝ 4 のとき mid ＝ 3、9 ≦ 10 で lo ← 3 のまま変わらず、止まりません。</p>`},
  {t:"選択肢を消す",h:`<ul class="elim">
<li class="x"><b>ア</b><span>lo と hi が隣り合うと無限ループ。</span></li>
<li class="o"><b>イ</b><span>正解。</span></li>
<li class="x"><b>ウ</b><span>さらに小さい側に寄り、無限ループになる。</span></li>
<li class="x"><b>エ</b><span>lo を考えておらず、範囲の外の mid を選ぶことがある。</span></li></ul>`}],
  sum:{type:"二分探索（答えの探索）",label:"lo ← mid の組 ＝「mid は切り上げ」",tip:"二分探索で lo ← mid（mid を残す）なら mid は切り上げ、hi ← mid なら切り捨て。隣り合った lo と hi で必ず確かめる。"}
}
]);
