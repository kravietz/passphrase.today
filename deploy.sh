#!/bin/sh

if [ ! -f compiler.jar ]; then
    f="compiler-latest.zip"
    wget "http://dl.google.com/closure-compiler/$f"
    unzip -o "$f" compiler.jar
    rm "$f"
fi

if [ ! -f htmlcompressor-1.5.3.jar ]; then
    wget https://htmlcompressor.googlecode.com/files/htmlcompressor-1.5.3.jar
fi

if [ ! -f yuicompressor.jar ]; then
    wget https://github.com/yui/yuicompressor/releases/download/v2.4.8/yuicompressor-2.4.8.jar
    mv yuicompressor-2.4.8.jar yuicompressor.jar
fi

if [ ! -d bootstrap ]; then
    wget https://github.com/twbs/bootstrap/releases/download/v3.3.4/bootstrap-3.3.4-dist.zip
    unzip bootstrap-3.3.4-dist.zip
    mv bootstrap-3.3.4-dist bootstrap
fi

if [ ! -d sjcl ]; then
    git clone https://github.com/bitwiseshiftleft/sjcl.git
    pushd sjcl
    ./configure --without-all --with-random --with-bn
    make
    popd
fi

if [ ! -d d3 ]; then
    git clone https://github.com/mbostock/d3.git
fi

if [ ! -f dict/english.js ]; then
    python3 js.py
fi

FONTS="Essays1743-bold-italic.eot Essays1743-bold-italic.ttf Essays1743-bold-italic.woff Essays1743-bold.eot Essays1743-bold.ttf Essays1743-bold.woff Essays1743-italic.eot Essays1743-italic.ttf Essays1743-italic.woff Essays1743.eot Essays1743.ttf Essays1743.woff"

for f in $FONTS; do
    if [ ! -f fonts/$f ]; then
        curl --compress -o "fonts/$f" "http://diveintohtml5.info/f/$f"
    fi
done

if [ -z "$1" ]; then
    output="output"
else
    output="$1"
    if [ "$output" = "ssh" ]; then
        output="output"
    fi
fi

if [ -d "$output" ]; then
    rm "$output/"*
else
    mkdir -p "$output"
fi

mkdir -p $output/{dict,fonts}

ln sjcl/sjcl.js $output/
ln robots.txt $output/
ln fonts/* $output/fonts/
ln favicon.ico $output/

cp cache.manifest $output/
echo "# build $(date|md5)" >>$output/cache.manifest

cp -a bootstrap $output/

ln dict/*.js $output/dict/

# when changing names, update cache.manifest
java -jar compiler.jar \
    --js {entropy,passphrase,random,titles,dict,app}.js \
    --third_party \
    --compilation_level SIMPLE \
    --formatting PRETTY_PRINT \
    --charset UTF8 \
    --create_source_map $output/main.js.map \
    > $output/main.js
java -jar compiler.jar \
    --js {random,plot}.js \
    --third_party \
    --compilation_level SIMPLE \
    --formatting PRETTY_PRINT \
    --charset UTF8 \
    --create_source_map $output/plot.js.map \
    > $output/plot.js

i="index.html"
awk -f script.awk $i | java -jar htmlcompressor-1.5.3.jar --compress-js --compress-css > $output/$i
i="plot.html"
java -jar htmlcompressor-1.5.3.jar --compress-js --compress-css $i > $output/$i
i='styles.css'
java -jar htmlcompressor-1.5.3.jar --compress-css $i > $output/$i

find $output/ | egrep '\.(html|map|svg|eot|woff|woff2|ttf|css|js|manifest)$' | xargs gzip -9kf
#cp logo.png apple-touch-icon.png
#cp apple-touch-icon.png touch-icon-ipad.png
#cp apple-touch-icon.png touch-icon-iphone-retina.png
#cp apple-touch-icon.png touch-icon-ipad-retina.png
#mogrify -geometry 76x76 touch-icon-ipad.png
#mogrify -geometry 120x120 touch-icon-iphone-retina.png
#mogrify -geometry 152x152 touch-icon-ipad-retina.png

if [ "$1" = "ssh" ]; then
    rsync --compress-level=9 -avz --delete output/ kautsky:passphrase/
fi