find . -name 'ortnamn-tecken.json' | xargs grep -l 'frigg.isof' | xargs sed -i.bak s/frigg.isof.se/frigg-test.isof.se/g
