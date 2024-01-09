find . -name '*.json' | xargs grep -l 'olandskartan.isof.se' | xargs sed -i.bak s/olandskartan.isof.se/olandskartan-test.isof.se/g
find . -name '*.json' | xargs grep -l 'ortnamn-tecken.isof.se' | xargs sed -i.bak s/ortnamn-tecken.isof.se/ortnamn-tecken-test.isof.se/g
find . -name '*.json' | xargs grep -l 'sifferkartan.isof.se' | xargs sed -i.bak s/sifferkartan.isof.se/sifferkartan-test.isof.se/g
