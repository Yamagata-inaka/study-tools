window.PX = (window.PX || []).concat([
{ id:"ob-1", year:"文字列", no:1, topic:"回文の判定",
  stem:`<p>次の記述中の［　　］に入れる正しい答えを，解答群の中から選べ。</p>
<p>関数 isPalindrome は，1 文字以上の文字列 s を受け取り，s が前から読んでも後ろから読んでも同じ文字列（回文）であれば true を，そうでなければ false を返す。プログラム中の α に解答群の条件式を入れたとき，s によっては文字列の範囲外を参照してしまい，正しく動作しないものは［　　］である。</p>`,
  code:[
".○論理型: isPalindrome(文字列型: s)",
"+   整数型: left ← 1",
"+   整数型: right ← sの文字数",
"!   while (α)",
"+      if (sのleft文字目 ≠ sのright文字目)",
".         return false",
".      endif",
"+      left ← left ＋ 1",
"+      right ← right － 1",
".   endwhile",
".   return true"],
  choices:{rows:[["ア","left ＜ right"],["イ","left ≦ right"],["ウ","left ≠ right"],["エ","left ＜ right ＋ 1"]]},
  ans:"ウ",
  steps:[
  {t:"設問と選択肢を先に見る",h:`<p>「<span class="mk">正しく動作しないもの</span>」を選ぶ問題です。正しいものを選ぶ問題と逆なので、設問に印をつけておきます。</p>`},
  {t:"選択肢どうしの違いを見る",h:`<p>イとエは同じ意味です（整数では left ＜ right＋1 ⇔ left ≦ right）。アとイの違いは「真ん中の1文字を自分自身と比べるかどうか」で、比べても結果は変わりません。<b>残るのはウ</b>です。</p>`},
  {t:"目的を1行でつかむ",h:`<p class="mk">両端から内側へ1文字ずつ比べ、ぶつかったら終わる。</p>`},
  {t:"空欄の周りだけ読む",map:true,h:`<p>left は1ずつ増え、right は1ずつ減ります。文字数が<b>偶数</b>のとき、2人は同じ位置で出会わず、<b>すれ違います</b>。left ≠ right だと、すれ違った後も止まりません。</p>`},
  {t:"小さい例でトレース",h:`<p>偶数の文字数で回文の "abba" を、ウで追います。</p>
<div class="tw"><table class="tr"><tr><th>left</th><th>right</th><th>left ≠ right</th><th>比較</th></tr>
<tr><td>1</td><td>4</td><td>真</td><td>a ＝ a</td></tr>
<tr><td>2</td><td>3</td><td>真</td><td>b ＝ b</td></tr>
<tr><td>3</td><td>2</td><td>真（すれ違った）</td><td>b ＝ b</td></tr>
<tr><td>4</td><td>1</td><td>真</td><td>a ＝ a</td></tr>
<tr class="em"><td>5</td><td>0</td><td>真</td><td>5 文字目・0 文字目 → 範囲外</td></tr></table></div>
<p>奇数の "aba" なら left ＝ right ＝ 2 で止まるので、奇数だけ試すと気づけません。</p>`},
  {t:"選択肢を消す",h:`<ul class="elim">
<li class="x"><b>ア</b><span>正しく動作する。</span></li>
<li class="x"><b>イ</b><span>真ん中の文字を自分と比べるだけで、正しく動作する。</span></li>
<li class="o"><b>ウ</b><span>正解（動作しないもの）。偶数の文字数ですれ違って止まらない。</span></li>
<li class="x"><b>エ</b><span>イと同じ意味。</span></li></ul>`}],
  sum:{type:"両端からの比較",label:"while ＝「左右の指が交差するまで」",tip:"両端から近づける処理は、偶数と奇数の両方で止まるかを確かめる。≠ で止める条件は、すれ違いに弱い。"}
},
{ id:"ob-2", year:"文字列", no:2, topic:"単語の数",
  stem:`<p>次のプログラム中の［　　］に入れる正しい答えを，解答群の中から選べ。</p>
<p>関数 countWords は，英字と空白だけから成る文字列 s を受け取り，s に含まれる単語の数を返す。単語とは，空白を含まない 1 文字以上の連続した英字の並びとする。s の先頭や末尾に空白があることや，空白が連続することもある。例えば，s が "␣I␣␣am␣Tom␣" のとき 3 を返す（␣ は空白を表す）。</p>`,
  code:[
".○整数型: countWords(文字列型: s)",
".   整数型: i",
"+   整数型: count ← 0",
"+   論理型: inWord ← false",
"+   for (i を 1 から sの文字数 まで 1 ずつ増やす)",
"+      if (sのi文字目 が 空白)",
"+         inWord ← false",
"!      elseif ([[]])",
"+         count ← count ＋ 1",
"+         inWord ← true",
".      endif",
".   endfor",
".   return count"],
  fill:{"":"inWord が false"},
  choices:{rows:[["ア","inWord が true"],["イ","inWord が false"],["ウ","i が 1"],["エ","sの(i － 1)文字目 が 空白"]]},
  ans:"イ",
  steps:[
  {t:"設問と選択肢を先に見る",h:`<p>elseif に来るのは<b>英字のとき</b>だけです。英字のうち、どんなときに単語を1つ数えるかを選びます。</p>`},
  {t:"選択肢どうしの違いを見る",h:`<p>フラグの状態（ア・イ）か、位置（ウ）か、直前の文字（エ）か。エは考え方としては近いですが、i ＝ 1 のとき「0 文字目」を参照します。</p>`},
  {t:"目的を1行でつかむ",h:`<p class="mk">単語の外から中に入った瞬間（空白 → 英字）だけ数える。</p><p>inWord は「今、単語の中にいるか」の印です。</p>`},
  {t:"空欄の周りだけ読む",map:true,h:`<p>英字が来たとき、inWord が false なら「<b>単語に入った瞬間</b>」なので数えます。true なら同じ単語の続きなので数えません。</p>`},
  {t:"小さい例でトレース",h:`<p>"␣I␣␣am" で追います。</p>
<div class="tw"><table class="tr"><tr><th>i</th><th>文字</th><th>inWord（前）</th><th>イで数える？</th><th>count</th></tr>
<tr><td>1</td><td>␣</td><td>false</td><td>—</td><td>0</td></tr>
<tr><td>2</td><td>I</td><td>false</td><td>数える</td><td>1</td></tr>
<tr><td>3</td><td>␣</td><td>true</td><td>—</td><td>1</td></tr>
<tr><td>4</td><td>␣</td><td>false</td><td>—</td><td>1</td></tr>
<tr><td>5</td><td>a</td><td>false</td><td>数える</td><td>2</td></tr>
<tr class="em"><td>6</td><td>m</td><td>true</td><td>数えない</td><td>2</td></tr></table></div>`},
  {t:"選択肢を消す",h:`<ul class="elim">
<li class="x"><b>ア</b><span>inWord は最初 false で、ここでしか true にならないので、一度も数えない。</span></li>
<li class="o"><b>イ</b><span>正解。</span></li>
<li class="x"><b>ウ</b><span>先頭の1文字目しか見ない。</span></li>
<li class="x"><b>エ</b><span>i ＝ 1 で 0 文字目を参照する（先頭が英字の場合）。</span></li></ul>`}],
  sum:{type:"状態フラグによる区切りの検出",label:"inWord ＝「単語の中にいるか」",tip:"「切れ目で数える」問題は、状態が変わる瞬間（false → true）を条件にする。直前の文字を見る方法は、先頭の扱いに注意。"}
},
{ id:"ob-3", year:"文字列", no:3, topic:"ランレングス圧縮",
  stem:`<p>次のプログラム中の［ a ］と［ b ］に入れる正しい答えの組合せを，解答群の中から選べ。</p>
<p>関数 rle は，1 文字以上の英大文字だけから成る文字列 s を受け取り，同じ文字が連続する部分を「文字と連続する個数」に置き換えた文字列を返す。例えば，s が "AAABCC" のとき "A3B1C2" を返す。</p>`,
  code:[
".○文字列型: rle(文字列型: s)",
".   整数型: i",
".   文字列型: result ← \"\"",
"+   文字型: prev ← sの1文字目",
"+   整数型: count ← 1",
"+   for (i を 2 から sの文字数 まで 1 ずつ増やす)",
"+      if (sのi文字目 ＝ prev)",
"+         count ← count ＋ 1",
"+      else",
"+         resultの末尾 に prev と count をこの順に追加する",
"+         prev ← sのi文字目",
"!         [[a]]",
".      endif",
".   endfor",
"!   [[b]]",
".   return result"],
  fill:{a:"count ← 1",b:"resultの末尾 に prev と count をこの順に追加する"},
  choices:{cols:["a","b"],rows:[["ア","count ← 0","resultの末尾 に prev と count をこの順に追加する"],["イ","count ← 0","（何も記述しない）"],["ウ","count ← 1","resultの末尾 に prev と count をこの順に追加する"],["エ","count ← 1","（何も記述しない）"]]},
  ans:"ウ",
  steps:[
  {t:"設問と選択肢を先に見る",h:`<p>a は文字が切り替わったときの count の初期値、b はループ後の後始末です。<b>どちらも「境界の処理」</b>です。</p>`},
  {t:"選択肢どうしの違いを見る",h:`<p>a は 0 か 1 か。b は最後にもう1回追加するかどうか。<span class="mk">最後の連続が出力されるか</span>が b の決め手です。</p>`},
  {t:"目的を1行でつかむ",h:`<p class="mk">文字が変わるたびに「前の文字と個数」を書き出し、数え直す。</p>`},
  {t:"空欄の周りだけ読む",map:true,h:`<p><b>a</b>：文字が変わった時点で、その新しい文字（i 文字目）を<b>もう1個見ている</b>ので、count は 1 から始めます。最初の prev ← 1文字目 で count ← 1 にしているのと同じ理由です。</p>
<p><b>b</b>：書き出しは「文字が変わったとき」にしか起きません。最後の連続の後には変わり目がないので、<b>ループの後でもう一度書き出す</b>必要があります。</p>`},
  {t:"小さい例でトレース",h:`<p>"AAABCC" をウで追います。</p>
<div class="tw"><table class="tr"><tr><th>i</th><th>文字</th><th>処理</th><th>prev</th><th>count</th><th>result</th></tr>
<tr><td>開始</td><td></td><td></td><td>A</td><td>1</td><td>""</td></tr>
<tr><td>2</td><td>A</td><td>＋1</td><td>A</td><td>2</td><td>""</td></tr>
<tr><td>3</td><td>A</td><td>＋1</td><td>A</td><td>3</td><td>""</td></tr>
<tr><td>4</td><td>B</td><td>A3 を追加</td><td>B</td><td>1</td><td>A3</td></tr>
<tr><td>5</td><td>C</td><td>B1 を追加</td><td>C</td><td>1</td><td>A3B1</td></tr>
<tr><td>6</td><td>C</td><td>＋1</td><td>C</td><td>2</td><td>A3B1</td></tr>
<tr class="em"><td>後</td><td></td><td>b：C2 を追加</td><td></td><td></td><td>A3B1C2</td></tr></table></div>
<p>a が count ← 0 だと "A3B0C1"、b がないと "A3B1" になります。</p>`},
  {t:"選択肢を消す",h:`<ul class="elim">
<li class="x"><b>ア</b><span>2つ目以降の文字の個数が1少ない。</span></li>
<li class="x"><b>イ</b><span>個数がずれるうえ、最後の連続が出力されない。</span></li>
<li class="o"><b>ウ</b><span>正解。</span></li>
<li class="x"><b>エ</b><span>最後の連続（C2）が出力されない。</span></li></ul>`}],
  sum:{type:"連続の集計（ランレングス）",label:"else ＝「切れ目で書き出して数え直す」",tip:"「切れ目で出力する」処理は、最後の塊に切れ目がないので、ループ後の後始末が必要になることが多い。"}
},
{ id:"ob-4", year:"文字列", no:4, topic:"シーザー暗号の復号",
  stem:`<p>次のプログラム中の［　　］に入れる正しい答えを，解答群の中から選べ。</p>
<p>英大文字だけから成る文字列の各文字を，アルファベット順で k 文字後ろの文字に置き換える暗号がある（Z の次は A に戻る）。例えば k ＝ 3 のとき，"XYZ" は "ABC" に暗号化される。関数 decrypt は，暗号化された文字列 t と k（0 ≦ k ≦ 25）を受け取り，元の文字列を返す。</p>
<p>関数 code は英大文字を受け取り，A なら 0，B なら 1，…，Z なら 25 を返す。関数 letter は 0〜25 の整数を受け取り，code の逆の対応で英大文字を返す。ここで，演算子 mod の左側の値が負の場合，結果は負の値になることがあるものとする。</p>`,
  code:[
".○文字列型: decrypt(文字列型: t, 整数型: k)",
".   整数型: i",
".   文字列型: result ← \"\"",
"+   for (i を 1 から tの文字数 まで 1 ずつ増やす)",
"!      resultの末尾 に letter([[]]) を追加する",
".   endfor",
".   return result"],
  fill:{"":"(code(tのi文字目) － k ＋ 26) mod 26"},
  choices:{rows:[["ア","(code(tのi文字目) － k) mod 26"],["イ","(code(tのi文字目) ＋ k) mod 26"],["ウ","(code(tのi文字目) － k ＋ 26) mod 26"],["エ","(code(tのi文字目) ＋ 26) mod 26 － k"]]},
  ans:"ウ",
  steps:[
  {t:"設問と選択肢を先に見る",h:`<p>letter に渡す数を選びます。letter は 0〜25 しか受け取れないので、<b>計算結果が必ず 0〜25 に収まる式</b>が必要です。</p>`},
  {t:"選択肢どうしの違いを見る",h:`<p>＋k か －k か、そして負になったときの対策（＋26）があるか。問題文の「<span class="mk">mod の左側が負なら結果が負になることがある</span>」は、ここを問うためのわざわざの注記です。</p>`},
  {t:"目的を1行でつかむ",h:`<p class="mk">k 文字前に戻す。A より前に戻ったら Z 側へ回す。</p>`},
  {t:"空欄の周りだけ読む",map:true,h:`<p>暗号化が「＋k」なので、復号は「－k」です。イは消えます。－k すると負になりうる（A ＝ 0 から 3 戻すと －3）ので、26 を足して 0 以上にしてから mod 26 を取ります。</p>`},
  {t:"小さい例でトレース",h:`<p>k ＝ 3、暗号文 "ABC"（元は "XYZ"）の1文字目 A（code ＝ 0）で比べます。</p>
<div class="tw"><table class="tr"><tr><th>選択肢</th><th>計算</th><th>結果</th></tr>
<tr><td>ア</td><td>(0 － 3) mod 26</td><td>－3 になりうる → letter に渡せない</td></tr>
<tr><td>イ</td><td>(0 ＋ 3) mod 26</td><td>3 → D ×</td></tr>
<tr class="em"><td>ウ</td><td>(0 － 3 ＋ 26) mod 26</td><td>23 → X ○</td></tr>
<tr><td>エ</td><td>(0 ＋ 26) mod 26 － 3</td><td>0 － 3 ＝ －3 ×</td></tr></table></div>
<p>D（code ＝ 3）のように負にならない文字だけで試すと、アとウの区別がつきません。<b>A のように端の文字で試す</b>のがコツです。</p>`},
  {t:"選択肢を消す",h:`<ul class="elim">
<li class="x"><b>ア</b><span>負の値が letter に渡ることがある。</span></li>
<li class="x"><b>イ</b><span>さらに暗号化している。</span></li>
<li class="o"><b>ウ</b><span>正解。</span></li>
<li class="x"><b>エ</b><span>mod の後で引くので負になる。</span></li></ul>`}],
  sum:{type:"剰余による循環",label:"空欄 ＝「k 戻して 0〜25 に収める」",tip:"mod で循環させる計算は、引き算の前に周期（ここでは 26）を足して負を防ぐ。端の値（A や Z）で試す。"}
},
{ id:"ob-5", year:"文字列", no:5, topic:"文字列の反転",
  stem:`<p>次のプログラム中の［　　］に入れる正しい答えを，解答群の中から選べ。</p>
<p>関数 reverseStr は，1 文字以上の文字列 s を受け取り，s の文字を逆順に並べた文字列を返す。例えば，s が "abc" のとき "cba" を返す。ここで，文字列どうしの演算子 ＋ は，左の文字列の後ろに右の文字列を連結した文字列を表す。</p>`,
  code:[
".○文字列型: reverseStr(文字列型: s)",
".   整数型: i",
"+   整数型: n ← sの文字数",
"+   文字列型: result ← \"\"",
"+   for (i を 1 から n まで 1 ずつ増やす)",
"!      result ← [[]]",
".   endfor",
".   return result"],
  fill:{"":"sのi文字目 ＋ result"},
  choices:{rows:[["ア","result ＋ sのi文字目"],["イ","sのi文字目 ＋ result"],["ウ","result ＋ sの(n － i)文字目"],["エ","sの(n － i ＋ 1)文字目 ＋ result"]]},
  ans:"イ",
  steps:[
  {t:"設問と選択肢を先に見る",h:`<p>ループ本体の1行が空欄です。<b>前から読んだ文字を result のどちら側に付けるか</b>を選びます。</p>`},
  {t:"選択肢どうしの違いを見る",h:`<ul><li>付ける側：後ろ（result ＋ 文字）か、前（文字 ＋ result）か</li><li>読む位置：i 文字目（前から）か、n－i 文字目・n－i＋1 文字目（後ろから）か</li></ul><p>「前から読んで前に付ける」か「後ろから読んで後ろに付ける」のどちらかなら逆順になります。後者の正しい位置は n－i＋1 です。</p>`},
  {t:"目的を1行でつかむ",h:`<p class="mk">新しく読んだ文字を、これまでの結果の前に置いていく。</p>`},
  {t:"空欄の周りだけ読む",map:true,h:`<p>ウは「後ろから読んで後ろに付ける」形ですが、位置が n－i で1つずれています（i ＝ n で 0 文字目）。エは後ろから読んで<b>前に</b>付けるので、2回反転して元に戻ります。</p>`},
  {t:"小さい例でトレース",h:`<p>"abc" で比べます。</p>
<div class="tw"><table class="tr"><tr><th>i</th><th>イ：文字＋result</th><th>エ：(n－i＋1)文字目＋result</th><th>ア：result＋文字</th></tr>
<tr><td>1</td><td>"a"</td><td>"c"</td><td>"a"</td></tr>
<tr><td>2</td><td>"ba"</td><td>"bc"</td><td>"ab"</td></tr>
<tr class="em"><td>3</td><td>"cba" ○</td><td>"abc" ×</td><td>"abc" ×</td></tr></table></div>`},
  {t:"選択肢を消す",h:`<ul class="elim">
<li class="x"><b>ア</b><span>元の文字列のまま。</span></li>
<li class="o"><b>イ</b><span>正解。</span></li>
<li class="x"><b>ウ</b><span>1文字ずれて、i ＝ n で 0 文字目を参照する。</span></li>
<li class="x"><b>エ</b><span>二重に反転して元に戻る。</span></li></ul>`}],
  sum:{type:"文字列の組み立て",label:"空欄 ＝「読んだ文字を前に置く」",tip:"文字列の連結は、左右の順番が結果を決める。3文字の例を表に書けば、どの選択肢も1分で確かめられる。"}
},
{ id:"ob-6", year:"文字列", no:6, topic:"括弧の対応",
  stem:`<p>次のプログラム中の［ a ］と［ b ］に入れる正しい答えの組合せを，解答群の中から選べ。</p>
<p>関数 balanced は，“(” と “)” だけから成る文字列 s を受け取り，括弧の対応が正しければ true を，そうでなければ false を返す。対応が正しいとは，s を先頭から読んだとき，どの位置までの “)” の数も “(” の数を超えず，かつ，最後まで読んだときに両者の数が等しいことをいう。例えば，"(())()" は正しく，"())(" や "(()" は正しくない。</p>`,
  code:[
".○論理型: balanced(文字列型: s)",
".   整数型: i",
"+   整数型: depth ← 0",
"+   for (i を 1 から sの文字数 まで 1 ずつ増やす)",
"+      if (sのi文字目 ＝ \"(\")",
"+         depth ← depth ＋ 1",
".      else",
"+         depth ← depth － 1",
".      endif",
"!      if ([[a]])",
"+         return false",
".      endif",
".   endfor",
"!   return [[b]]"],
  fill:{a:"depth ＜ 0",b:"depth ＝ 0"},
  choices:{cols:["a","b"],rows:[["ア","depth ＜ 0","depth ＝ 0"],["イ","depth ＜ 0","true"],["ウ","depth ≠ 0","depth ＝ 0"],["エ","depth ＞ 0","true"]]},
  ans:"ア",
  steps:[
  {t:"設問と選択肢を先に見る",h:`<p>a は途中で失敗を見つける条件、b は最後に返す値です。問題文の「正しい」の定義が<b>2つの条件</b>から成っていて、a と b がそれぞれに対応します。</p>`},
  {t:"選択肢どうしの違いを見る",h:`<ul><li>a：depth ＜ 0、≠ 0、＞ 0</li><li>b：depth ＝ 0 を返すか、無条件に true か</li></ul>`},
  {t:"目的を1行でつかむ",h:`<p>depth は「開いたままの括弧の数」です。定義と対応させます。</p><ul><li>「どの位置までも “)” が “(” を超えない」→ 途中で <b>depth が負にならない</b>（a）</li><li>「最後に数が等しい」→ 最後に <b>depth ＝ 0</b>（b）</li></ul>`},
  {t:"空欄の周りだけ読む",map:true,h:`<p>a に depth ≠ 0 を入れると、"(" を1文字読んだだけ（depth ＝ 1）で false になってしまいます。</p>`},
  {t:"小さい例でトレース",h:`<div class="tw"><table class="tr"><tr><th>s</th><th>depth の推移</th><th>アの結果</th><th>イの結果</th></tr>
<tr><td>"(())()"</td><td>1,2,1,0,1,0</td><td>true ○</td><td>true</td></tr>
<tr><td>"())("</td><td>1,0,−1 で停止</td><td>false ○</td><td>false</td></tr>
<tr class="em"><td>"(()"</td><td>1,2,1 → 終了</td><td>depth ＝ 1 なので false ○</td><td>true ×</td></tr></table></div>
<p>問題文の3つの例を表にすると、イは "(()" で間違えることが分かります。</p>`},
  {t:"選択肢を消す",h:`<ul class="elim">
<li class="o"><b>ア</b><span>正解。</span></li>
<li class="x"><b>イ</b><span>閉じ忘れ（"(()"）を見逃す。</span></li>
<li class="x"><b>ウ</b><span>最初の "(" で false になる。</span></li>
<li class="x"><b>エ</b><span>"(" を読んだ時点で false になる。</span></li></ul>`}],
  sum:{type:"カウンタによる対応チェック",label:"depth ＝「開いたままの括弧の数」",tip:"問題文に「正しい」の定義が箇条で書かれていたら、それぞれがプログラムのどの行に対応するかを線で結ぶ。問題文の例は全部試す価値がある。"}
},
{ id:"ob-7", year:"文字列", no:7, topic:"アナグラムの判定",
  stem:`<p>次のプログラム中の［　　］に入れる正しい答えを，解答群の中から選べ。ここで，配列の要素番号は 1 から始まる。</p>
<p>関数 isAnagram は，英大文字だけから成る文字列 s1 及び s2 を受け取り，s2 が s1 の文字を並べ替えたものであれば true を，そうでなければ false を返す。s1 と s2 の文字数が異なることもある。関数 code は英大文字を受け取り，A なら 0，B なら 1，…，Z なら 25 を返す。</p>`,
  code:[
".○論理型: isAnagram(文字列型: s1, 文字列型: s2)",
"+   整数型の配列: cnt ← {26個の 0}",
".   整数型: i, k",
"+   for (i を 1 から s1の文字数 まで 1 ずつ増やす)",
"+      cnt[code(s1のi文字目) ＋ 1] ← cnt[code(s1のi文字目) ＋ 1] ＋ 1",
".   endfor",
"+   for (i を 1 から s2の文字数 まで 1 ずつ増やす)",
"+      cnt[code(s2のi文字目) ＋ 1] ← cnt[code(s2のi文字目) ＋ 1] － 1",
".   endfor",
"+   for (k を 1 から 26 まで 1 ずつ増やす)",
"!      if ([[]])",
".         return false",
".      endif",
".   endfor",
".   return true"],
  fill:{"":"cnt[k] ≠ 0"},
  choices:{rows:[["ア","cnt[k] ≠ 0"],["イ","cnt[k] ＞ 0"],["ウ","cnt[k] ＜ 0"],["エ","cnt[k] ＝ 0"]]},
  ans:"ア",
  steps:[
  {t:"設問と選択肢を先に見る",h:`<p>最後のループで false を返す条件です。<b>cnt に何が残っていたら並べ替えではないか</b>を考えます。</p>`},
  {t:"選択肢どうしの違いを見る",h:`<p>≠ 0、＞ 0、＜ 0、＝ 0。<span class="mk">文字数が違う場合もある</span>という注記が、＞ と ＜ の片方だけでは足りないことを示しています。</p>`},
  {t:"目的を1行でつかむ",h:`<p class="mk">s1 の文字で ＋1、s2 の文字で －1。全部 0 に戻れば同じ文字構成。</p><p>cnt[k] ＞ 0 は「s1 に多い文字」、cnt[k] ＜ 0 は「s2 に多い文字」です。どちらがあっても並べ替えではありません。</p>`},
  {t:"空欄の周りだけ読む",map:true,h:`<p>前の2つのループは「文字ごとの差を数える」とラベルを付けて終わりです。添字の ＋1 は、code が 0 から始まり配列が 1 から始まるためのずらしです。</p>`},
  {t:"小さい例でトレース",h:`<div class="tw"><table class="tr"><tr><th>s1</th><th>s2</th><th>cnt（0 でないもの）</th><th>ア</th><th>イ</th><th>ウ</th></tr>
<tr><td>"AB"</td><td>"BA"</td><td>なし</td><td>true ○</td><td>true</td><td>true</td></tr>
<tr><td>"AAB"</td><td>"AB"</td><td>A：＋1</td><td>false ○</td><td>false</td><td>true ×</td></tr>
<tr class="em"><td>"AB"</td><td>"ABB"</td><td>B：－1</td><td>false ○</td><td>true ×</td><td>false</td></tr></table></div>`},
  {t:"選択肢を消す",h:`<ul class="elim">
<li class="o"><b>ア</b><span>正解。</span></li>
<li class="x"><b>イ</b><span>s2 の方が文字が多い場合を見逃す。</span></li>
<li class="x"><b>ウ</b><span>s1 の方が文字が多い場合を見逃す。</span></li>
<li class="x"><b>エ</b><span>一致している文字で false になる（逆）。</span></li></ul>`}],
  sum:{type:"計数用の配列（差分）",label:"cnt ＝「s1 と s2 の文字数の差」",tip:"＋と－で打ち消し合う集計は、最後に「全部 0 か」を確かめる。＞ や ＜ の片方だけの選択肢は、反対側の偏りで反例を作る。"}
},
{ id:"ob-8", year:"文字列", no:8, topic:"最長の連続",
  stem:`<p>次の記述中の［　　］に入れる正しい答えを，解答群の中から選べ。</p>
<p>次の関数 longestRun は，1 文字以上の文字列 s で，同じ文字が連続する部分の最大の長さを返すことを意図して作成したものである。しかし，プログラムには誤りがある。関数 longestRun を longestRun("aabbbabbbb") として呼び出すと，戻り値は［　　］となる。</p>`,
  code:[
".○整数型: longestRun(文字列型: s)",
".   整数型: i",
"+   整数型: run ← 1",
"+   整数型: best ← 1",
"+   for (i を 2 から sの文字数 まで 1 ずつ増やす)",
"+      if (sのi文字目 ＝ sの(i － 1)文字目)",
"+         run ← run ＋ 1",
".      else",
"!         if (run ＞ best)",
"!            best ← run",
".         endif",
"+         run ← 1",
".      endif",
".   endfor",
".   return best"],
  choices:{rows:[["ア","1"],["イ","2"],["ウ","3"],["エ","4"],["オ","7"]]},
  ans:"ウ",
  steps:[
  {t:"設問と選択肢を先に見る",h:`<p>「誤りがある」プログラムの<b>実際の</b>戻り値を問われています。<span class="mk">意図した答えではなく、書かれたとおりに動いた結果</span>を答えます。</p>`},
  {t:"選択肢どうしの違いを見る",h:`<p>正しく動けば最長の連続 "bbbb" で 4 になるはずです。エは「意図どおりの答え」という罠の可能性が高く、誤りがあるなら答えは別になるはずだと予想できます。オの 7 は b の総数です。</p>`},
  {t:"目的を1行でつかむ",h:`<p class="mk">文字が切り替わったときにだけ、それまでの連続の長さで best を更新する。</p><p>best の更新が <b>else の中（切り替わったとき）にしかない</b>のが特徴です。</p>`},
  {t:"空欄の周りだけ読む",map:true,h:`<p>更新が「切り替わり」でしか起きないので、<b>最後の連続の後には切り替わりがなく、最後の連続は best に反映されません</b>。ランレングス（文字列 問3）と同じ「後始末忘れ」の誤りです。</p>`},
  {t:"小さい例でトレース",h:`<p>連続の塊に分けると aa ／ bbb ／ a ／ bbbb です。</p>
<div class="tw"><table class="tr"><tr><th>切り替わり</th><th>そのときの run</th><th>best</th></tr>
<tr><td>a → b（i ＝ 3）</td><td>2</td><td>2</td></tr>
<tr><td>b → a（i ＝ 6）</td><td>3</td><td>3</td></tr>
<tr><td>a → b（i ＝ 7）</td><td>1</td><td>3</td></tr>
<tr class="em"><td>（終了）</td><td>4 のまま</td><td>3</td></tr></table></div>
<p>戻り値は <b>3</b> です。</p>`},
  {t:"選択肢を消す",h:`<ul class="elim">
<li class="x"><b>エ</b><span>正しく動いた場合の値。このプログラムでは最後の "bbbb" が反映されない。</span></li>
<li class="o"><b>ウ</b><span>正解。</span></li>
<li class="x"><b>イ</b><span>最初の切り替わりでの値。</span></li>
<li class="x"><b>オ</b><span>b の総数。</span></li>
<li class="x"><b>ア</b><span>初期値のまま。</span></li></ul>`}],
  sum:{type:"誤りのあるプログラムのトレース",label:"else ＝「切れ目で最大を更新」（最後の塊が漏れる）",tip:"「誤りがある」と書かれた問題は、意図した答えが罠の選択肢に入っている。頭で補正せず、書かれた行だけを機械的に追う。"}
}
]);
