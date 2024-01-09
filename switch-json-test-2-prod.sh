find . -name '*.json' | xargs grep -l 'olandskartan-test.isof.se' | xargs sed -i.bak s/olandskartani-test.isof.se/olandskartan.isof.se/g
find . -name '*.json' | xargs grep -l 'ortnamn-teckeni-test.isof.se' | xargs sed -i.bak s/ortnamn-tecken-test.isof.se/ortnamn-tecken.isof.se/g
find . -name '*.json' | xargs grep -l 'sifferkartan-test.isof.se' | xargs sed -i.bak s/sifferkartan-test.isof.se/sifferkartan.isof.se/g
