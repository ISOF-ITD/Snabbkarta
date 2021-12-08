find . -name 'ortnamn-tecken.json' | xargs grep -l 'frigg-test.isof' | xargs sed -i.bak s/frigg-test.isof.se/frigg.isof.se/g
