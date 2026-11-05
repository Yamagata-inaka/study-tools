window.PI = (window.PI || []).concat([
{ id:"kp-1", year:"サンプル問題（2022）", no:1, topic:"入場料の条件",
  stem:`<p>次のプログラム中の［　　］に入れる正しい答えを，解答群の中から選べ。</p>
<p>ある施設の入場料は，0 歳から 3 歳までは 100 円，4 歳から 9 歳までは 300 円，10 歳以上は 500 円である。関数 fee は，年齢を表す 0 以上の整数を引数として受け取り，入場料を返す。</p>`,
  code:[
".○整数型: fee(整数型: age)",
".   整数型: ret",
"+   if (age が 3 以下)",
"+      ret ← 100",
"!   elseif ([[]])",
"!      ret ← 300",
".   else",
".      ret ← 500",
".   endif",
".   return ret"],
  fill:{"":"age が 9 以下"},
  choices:{rows:[["ア","(age が 4 以上) and (age が 9 より小さい)"],["イ","(age が 4 と等しい) or (age が 9 と等しい)"],["ウ","(age が 4 より大きい) and (age が 9 以下)"],["エ","age が 4 以上"],["オ","age が 4 より大きい"],["カ","age が 9 以下"],["キ","age が 9 より小さい"]]},
  ans:"カ",
  steps:[
  {t:"設問と選択肢を先に見る",h:`<p>elseif の条件です。この行に来るのは <b>if（3 以下）が偽だった人、つまり 4 歳以上</b>だけです。</p>`},
  {t:"選択肢どうしの違いを見る",h:`<p>4 以上を確かめる条件が入っているもの（ア・ウ・エ・オ）と、9 以下だけのもの（カ・キ）があります。<span class="mk">前の if で 3 以下はもう除かれている</span>ので、4 以上の確認は不要です。</p>`},
  {t:"目的を1行でつかむ",h:`<p class="mk">4〜9 歳を 300 円にする。ここに来る時点で 4 歳以上は確定済み。</p>`},
  {t:"空欄の周りだけ読む",map:true,h:`<p>残る条件は「9 以下」だけです。境界は「9 歳までは 300 円」なので、9 を含みます（9 より小さい、では 9 歳が 500 円になります）。</p>`},
  {t:"小さい例でトレース",h:`<p>境界の 4 歳・9 歳・10 歳で確かめます。</p>
<div class="tw"><table class="tr"><tr><th>年齢</th><th>正しい料金</th><th>カ</th><th>キ</th><th>ア</th><th>ウ</th></tr>
<tr><td>4</td><td>300</td><td>300</td><td>300</td><td>300</td><td>500 ×</td></tr>
<tr class="em"><td>9</td><td>300</td><td>300</td><td>500 ×</td><td>500 ×</td><td>300</td></tr>
<tr><td>10</td><td>500</td><td>500</td><td>500</td><td>500</td><td>500</td></tr></table></div>
<p>エ・オは 10 歳以上も 300 円になります。</p>`},
  {t:"選択肢を消す",h:`<ul class="elim">
<li class="x"><b>ア・キ</b><span>9 歳が含まれない。</span></li>
<li class="x"><b>イ</b><span>4 歳と 9 歳だけで、5〜8 歳が含まれない。</span></li>
<li class="x"><b>ウ</b><span>4 歳が含まれない。</span></li>
<li class="x"><b>エ・オ</b><span>10 歳以上も 300 円になる。</span></li>
<li class="o"><b>カ</b><span>正解。</span></li></ul>`}],
  sum:{type:"条件分岐（範囲）",label:"elseif ＝「前の条件が偽だった値だけが来る」",tip:"elseif の条件は、前の条件で除かれた範囲を考えに入れる。境界の値（4, 9, 10）で全選択肢を試す。"}
},
{ id:"kp-2", year:"サンプル問題（2022）", no:2, topic:"配列の逆順",
  stem:`<p>次のプログラム中の［ a ］と［ b ］に入れる正しい答えの組合せを，解答群の中から選べ。ここで，配列の要素番号は 1 から始まる。</p>
<p>次のプログラムは，整数型の配列 array の要素の並びを逆順にする。</p>`,
  code:[
"+整数型の配列: array ← {1, 2, 3, 4, 5}",
".整数型: right, left",
".整数型: tmp",
"+for (left を 1 から (arrayの要素数 ÷ 2 の商) まで 1 ずつ増やす)",
"!   right ← [[a]]",
"+   tmp ← array[right]",
"+   array[right] ← array[left]",
"!   [[b]] ← tmp",
".endfor"],
  fill:{a:"arrayの要素数 － left ＋ 1",b:"array[left]"},
  choices:{cols:["a","b"],rows:[["ア","arrayの要素数 － left","array[left]"],["イ","arrayの要素数 － left","array[right]"],["ウ","arrayの要素数 － left ＋ 1","array[left]"],["エ","arrayの要素数 － left ＋ 1","array[right]"]]},
  ans:"ウ",
  steps:[
  {t:"設問と選択肢を先に見る",h:`<p>a は left と対になる右側の位置、b は交換の最後の代入先です。オリジナル問題「配列・ループ 問2」と同じ交換の型です。</p>`},
  {t:"選択肢どうしの違いを見る",h:`<p>a は ＋1 の有無、b は left か right か。どちらも<span class="mk">端の値を1つ入れれば</span>決まります。</p>`},
  {t:"目的を1行でつかむ",h:`<p class="mk">left 番目と、後ろから left 番目を交換する。</p>`},
  {t:"空欄の周りだけ読む",map:true,h:`<p><b>a</b>：left ＝ 1 のとき right は末尾の 5 でなければなりません。5 － 1 ＋ 1 ＝ 5 なので ＋1 が必要です。</p><p><b>b</b>：交換は「tmp に right の値を退避 → right に left の値 → <b>left に tmp</b>」の順です。</p>`},
  {t:"小さい例でトレース",h:`<div class="tw"><table class="tr"><tr><th>left</th><th>right（ウ）</th><th>処理後の array</th></tr>
<tr><td>1</td><td>5</td><td>{5, 2, 3, 4, 1}</td></tr>
<tr class="em"><td>2</td><td>4</td><td>{5, 4, 3, 2, 1}</td></tr></table></div>
<p>ア・イだと left ＝ 1 で right ＝ 4 となり、末尾の 5 が動きません。エだと b で array[right] に tmp（元の right の値）を戻すので、何も交換されません。</p>`},
  {t:"選択肢を消す",h:`<ul class="elim">
<li class="x"><b>ア・イ</b><span>right が1つずれる。</span></li>
<li class="o"><b>ウ</b><span>正解。</span></li>
<li class="x"><b>エ</b><span>right に元の値を戻すだけで、left が変わらない。</span></li></ul>`}],
  sum:{type:"配列の反転（交換）",label:"3行 ＝「tmp を使った交換」",tip:"交換は「退避 → 上書き → 退避した値を戻す」の3行。最後の代入先は、2行目の右辺に出てきた方。"}
},
{ id:"kp-3", year:"サンプル問題（2022）", no:3, topic:"リストへの追加",
  stem:`<p>次のプログラム中の［ a ］と［ b ］に入れる正しい答えの組合せを，解答群の中から選べ。</p>
<p>手続 append は，引数で与えられた文字を単方向リストに追加する手続である。単方向リストの各要素は，クラス ListElement を用いて表現する。ListElement 型の変数はクラス ListElement のインスタンスの参照を格納するものとする。大域変数 listHead は，単方向リストの先頭の要素の参照を格納する。リストが空のときは，listHead は未定義である。</p>
<div class="box">メンバ変数 val（文字型）：リストに格納する文字。<br>メンバ変数 next（ListElement）：リストの次の文字を保持するインスタンスの参照。初期状態は未定義である。<br>コンストラクタ ListElement(文字型: qVal)：引数 qVal でメンバ変数 val を初期化する。<div class="cap">図　クラス ListElement の説明</div></div>`,
  code:[
".大域: ListElement: listHead ← 未定義の値",
".",
".○append(文字型: qVal)",
".   ListElement: prev, curr",
"+   curr ← ListElement(qVal)",
"!   if (listHead が [[a]])",
"+      listHead ← curr",
".   else",
"+      prev ← listHead",
"+      while (prev.next が 未定義でない)",
"+         prev ← prev.next",
".      endwhile",
"!      prev.next ← [[b]]",
".   endif"],
  fill:{a:"未定義",b:"curr"},
  choices:{cols:["a","b"],rows:[["ア","未定義","curr"],["イ","未定義","curr.next"],["ウ","未定義","listHead"],["エ","未定義でない","curr"],["オ","未定義でない","curr.next"],["カ","未定義でない","listHead"]]},
  ans:"ア",
  steps:[
  {t:"設問と選択肢を先に見る",h:`<p>a は「リストが空か」の判定、b は末尾につなぐもの。<b>新しい要素は curr</b> です。</p>`},
  {t:"選択肢どうしの違いを見る",h:`<p>a は「未定義」か「未定義でない」かの2択、b は curr、curr.next、listHead の3択です。</p>`},
  {t:"目的を1行でつかむ",h:`<p class="mk">空なら先頭にする。空でなければ末尾まで進んで、末尾の次に新しい要素をつなぐ。</p>`},
  {t:"空欄の周りだけ読む",map:true,h:`<p><b>a</b>：真のとき listHead ← curr で「先頭にする」ので、リストが空（listHead が未定義）のときです。問題文に「リストが空のときは，listHead は未定義」とあります。</p><p><b>b</b>：while を抜けたとき prev は末尾の要素です。その次に新しい要素 curr をつなぎます。curr.next は未定義なのでつなぐ相手になりません。</p>`},
  {t:"小さい例でトレース",h:`<p>空のリストに "x"、"y" を順に追加します。</p>
<div class="tw"><table class="tr"><tr><th>呼出し</th><th>listHead</th><th>処理</th><th>リスト</th></tr>
<tr><td>append("x")</td><td>未定義</td><td>listHead ← x</td><td>x</td></tr>
<tr class="em"><td>append("y")</td><td>x</td><td>prev ＝ x（next 未定義で停止）→ x.next ← y</td><td>x → y</td></tr></table></div>`},
  {t:"選択肢を消す",h:`<ul class="elim">
<li class="o"><b>ア</b><span>正解。</span></li>
<li class="x"><b>イ</b><span>curr.next は未定義で、新しい要素がつながらない。</span></li>
<li class="x"><b>ウ</b><span>末尾が先頭を指す輪になる。</span></li>
<li class="x"><b>エ〜カ</b><span>空のときに else に進み、未定義の listHead.next を参照してしまう。</span></li></ul>`}],
  sum:{type:"連結リスト（末尾への追加）",label:"while ＝「末尾まで進む」",tip:"リストの問題は「空のとき」と「1個以上のとき」で分けて考える。空のリストで1回、1要素のリストで1回追加してみる。"}
},
{ id:"kp-4", year:"サンプル問題（2022）", no:4, topic:"疎行列の変換",
  stem:`<p>次の記述中の［ a ］～［ c ］に入れる正しい答えの組合せを，解答群の中から選べ。ここで，配列の要素番号は 1 から始まる。</p>
<p>要素の多くが 0 の行列を疎行列という。次のプログラムは，二次元配列に格納された行列のデータ量を削減するために，疎行列の格納に適したデータ構造に変換する。</p>
<p>関数 transformSparseMatrix は，引数 matrix で二次元配列として与えられた行列を，整数型配列の配列に変換して返す。関数 transformSparseMatrix を transformSparseMatrix({{3, 0, 0, 0, 0}, {0, 2, 2, 0, 0}, {0, 0, 0, 1, 3}, {0, 0, 0, 2, 0}, {0, 0, 0, 0, 1}}) として呼び出したときの戻り値は，{{［ a ］}, {［ b ］}, {［ c ］}} である。</p>
<div class="fig"><table><tr><td>3</td><td>0</td><td>0</td><td>0</td><td>0</td></tr><tr><td>0</td><td>2</td><td>2</td><td>0</td><td>0</td></tr><tr><td>0</td><td>0</td><td>0</td><td>1</td><td>3</td></tr><tr><td>0</td><td>0</td><td>0</td><td>2</td><td>0</td></tr><tr><td>0</td><td>0</td><td>0</td><td>0</td><td>1</td></tr></table><div class="cap">引数の行列（解説用に表にしたもの）</div></div>`,
  code:[
".○整数型配列の配列: transformSparseMatrix(整数型の二次元配列: matrix)",
".   整数型: i, j",
".   整数型配列の配列: sparseMatrix",
".   sparseMatrix ← {{}, {}, {}} /* 要素数0の配列を三つ要素にもつ配列 */",
"+   for (i を 1 から matrixの行数 まで 1 ずつ増やす)",
"+      for (j を 1 から matrixの列数 まで 1 ずつ増やす)",
"+         if (matrix[i, j] が 0 でない)",
"!            sparseMatrix[1]の末尾 に iの値 を追加する",
"!            sparseMatrix[2]の末尾 に jの値 を追加する",
"!            sparseMatrix[3]の末尾 に matrix[i, j]の値 を追加する",
".         endif",
".      endfor",
".   endfor",
".   return sparseMatrix"],
  choices:{cols:["a","b","c"],rows:[["ア","1, 2, 2, 3, 3, 4, 5","1, 2, 3, 4, 5, 4, 5","3, 2, 2, 1, 2, 3, 1"],["イ","1, 2, 2, 3, 3, 4, 5","1, 2, 3, 4, 5, 4, 5","3, 2, 2, 1, 3, 2, 1"],["ウ","1, 2, 3, 4, 5, 4, 5","1, 2, 2, 3, 3, 4, 5","3, 2, 2, 1, 2, 3, 1"],["エ","1, 2, 3, 4, 5, 4, 5","1, 2, 2, 3, 3, 4, 5","3, 2, 2, 1, 3, 2, 1"]]},
  ans:"イ",
  steps:[
  {t:"設問と選択肢を先に見る",h:`<p>戻り値の3つの配列 a（行番号）、b（列番号）、c（値）を答えます。0 でない要素を<b>行ごとに左から</b>拾っていく処理です。</p>`},
  {t:"選択肢どうしの違いを見る",h:`<p>a と b が入れ替わっているか（ア・イ と ウ・エ）、c の後半が「2, 3」か「3, 2」か。<span class="mk">拾う順番（行優先か列優先か）</span>で決まります。</p>`},
  {t:"目的を1行でつかむ",h:`<p class="mk">0 でない要素ごとに、(行, 列, 値) の3つ組を記録する。</p><p>外側のループが行（i）なので、1 行目から順に、各行の中は左から右へ拾います。</p>`},
  {t:"空欄の周りだけ読む",map:true,h:`<p>行列を左上から、行ごとに左から右へ読み、0 でない要素を書き出すだけです。</p>`},
  {t:"小さい例でトレース",h:`<div class="tw"><table class="tr"><tr><th>順番</th><th>行 i（a）</th><th>列 j（b）</th><th>値（c）</th></tr>
<tr><td>1</td><td>1</td><td>1</td><td>3</td></tr>
<tr><td>2</td><td>2</td><td>2</td><td>2</td></tr>
<tr><td>3</td><td>2</td><td>3</td><td>2</td></tr>
<tr><td>4</td><td>3</td><td>4</td><td>1</td></tr>
<tr class="em"><td>5</td><td>3</td><td>5</td><td>3</td></tr>
<tr class="em"><td>6</td><td>4</td><td>4</td><td>2</td></tr>
<tr><td>7</td><td>5</td><td>5</td><td>1</td></tr></table></div>
<p>a ＝ 1,2,2,3,3,4,5、b ＝ 1,2,3,4,5,4,5、c ＝ 3,2,2,1,3,2,1 でイです。5・6 番目は「3 行 5 列の 3」が「4 行 4 列の 2」より先です（同じ行の中を先に右へ進むため）。アは c の 5・6 番目が逆で、a・b の並びと対応しません。</p>`},
  {t:"選択肢を消す",h:`<ul class="elim">
<li class="x"><b>ア</b><span>c の後半の順番が違う（列ごとに拾った順）。</span></li>
<li class="o"><b>イ</b><span>正解。</span></li>
<li class="x"><b>ウ・エ</b><span>行番号と列番号が入れ替わっている。</span></li></ul>`}],
  sum:{type:"データ構造の変換（疎行列）",label:"二重ループ ＝「行ごとに左から0以外を拾う」",tip:"二重ループの外側が行なら行優先の順。拾った要素を1行ずつ表に書けば、選択肢の細かい違いを見落とさない。"}
},
{ id:"kp-5", year:"サンプル問題（2022）", no:5, topic:"文字の出現割合",
  stem:`<p>次のプログラム中の［　　］に入れる正しい答えを，解答群の中から選べ。</p>
<p>任意の異なる 2 文字を c1，c2 とするとき，英単語群に含まれる英単語において，c1 の次に c2 が出現する割合を求めるプログラムである。英単語は，英小文字だけから成る。英単語の末尾の文字が c1 である場合，その箇所は割合の計算に含めない。例えば，4 語の英単語“importance”，“inflation”，“information”，“innovation”から成る英単語群において，c1 を“n”，c2 を“f”とする。英単語の末尾の文字以外に“n”は五つあり，そのうち次の文字が“f”であるものは二つである。したがって，求める割合は，2 ÷ 5 ＝ 0.4 である。c1 と c2 の並びが一度も出現しない場合，c1 の出現回数によらず割合を 0 と定義する。</p>
<p>プログラムにおいて，英単語群は Words 型の大域変数 words に格納されている。本問において，文字列に対する演算子“＋”は，文字列の連結を表す。また，整数に対する演算子“÷”は，実数として計算する。</p>
<div class="box">freq(文字列型: str)：英単語群中の文字列 str の出現回数を返す（整数型）。<br>freqE(文字列型: str)：英単語群の中で，文字列 str で終わる英単語の数を返す（整数型）。<div class="cap">表　クラス Words のメソッドの説明</div></div>`,
  code:[
".大域: Words: words /* 英単語群が格納されている */",
".",
"./* c1の次にc2が出現する割合を返す */",
".○実数型: prob(文字型: c1, 文字型: c2)",
"+   文字列型: s1 ← c1の1文字だけから成る文字列",
"+   文字列型: s2 ← c2の1文字だけから成る文字列",
"+   if (words.freq(s1 ＋ s2) が 0 より大きい)",
"!      return [[]]",
".   else",
".      return 0",
".   endif"],
  fill:{"":"words.freq(s1 ＋ s2) ÷ (words.freq(s1) － words.freqE(s1))"},
  choices:{rows:[["ア","(words.freq(s1) － words.freqE(s1)) ÷ words.freq(s1 ＋ s2)"],["イ","(words.freq(s2) － words.freqE(s2)) ÷ words.freq(s1 ＋ s2)"],["ウ","words.freq(s1 ＋ s2) ÷ (words.freq(s1) － words.freqE(s1))"],["エ","words.freq(s1 ＋ s2) ÷ (words.freq(s2) － words.freqE(s2))"]]},
  ans:"ウ",
  steps:[
  {t:"設問と選択肢を先に見る",h:`<p>割合の式を選びます。問題文の例「<span class="mk">2 ÷ 5 ＝ 0.4</span>」の 2 と 5 がそれぞれ何かを特定すれば、式が決まります。</p>`},
  {t:"選択肢どうしの違いを見る",h:`<p>分子と分母が逆か（ア・イ と ウ・エ）、分母が s1 の数か s2 の数か。割合なので答えは 1 以下のはずで、ア・イは 1 以上になります。</p>`},
  {t:"目的を1行でつかむ",h:`<p class="mk">割合 ＝ “c1c2” の出現回数 ÷（c1 の出現回数 － 末尾が c1 の単語の数）。</p><p>例では 2 ＝ “nf” の回数、5 ＝ 末尾以外の “n” の数です。</p>`},
  {t:"空欄の周りだけ読む",map:true,h:`<p>メソッドに置き換えます。“nf” の回数 ＝ freq(s1 ＋ s2)。末尾以外の “n” の数 ＝ freq(s1)（全部の “n”）－ freqE(s1)（“n” で終わる単語の数 ＝ 末尾の “n” の数）。</p>`},
  {t:"小さい例でトレース",h:`<p>例の4語で数を確かめます。</p>
<div class="tw"><table class="tr"><tr><th>メソッド</th><th>値</th></tr>
<tr><td>freq("nf")</td><td>2（inflation, information）</td></tr>
<tr><td>freq("n")</td><td>8（importance 1, inflation 2, information 2, innovation 3）</td></tr>
<tr><td>freqE("n")</td><td>3（inflation, information, innovation）</td></tr>
<tr class="em"><td>ウの式</td><td>2 ÷ (8 － 3) ＝ 0.4 ○</td></tr></table></div>`},
  {t:"選択肢を消す",h:`<ul class="elim">
<li class="x"><b>ア</b><span>分子と分母が逆（2.5 になる）。</span></li>
<li class="x"><b>イ・エ</b><span>c2 の数を基準にしている。</span></li>
<li class="o"><b>ウ</b><span>正解。</span></li></ul>`}],
  sum:{type:"ライブラリの利用（統計）",label:"return ＝「c1c2 の数 ÷ 末尾以外の c1 の数」",tip:"問題文の具体例の数字が、式のどの部分にあたるかを特定する。割合は 1 以下になるので、それだけで消せる選択肢もある。"}
}
]);
