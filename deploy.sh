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

if [ ! -f dict/english.js ]; then
    python3 js.py
fi

FONTS="Essays1743-bold-italic.eot Essays1743-bold-italic.ttf Essays1743-bold-italic.woff Essays1743-bold.eot Essays1743-bold.ttf Essays1743-bold.woff Essays1743-italic.eot Essays1743-italic.ttf Essays1743-italic.woff Essays1743.eot Essays1743.ttf Essays1743.woff"

for f in ${FONTS}; do
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
    rm -rf "${output}/dict"
    rm -rf "${output}/fonts"
    rm -rf "${output}/bootstrap"
    rm "$output/"*
else
    mkdir -p "$output"
fi

mkdir -p ${output}/{dict,fonts}

cp sjcl/sjcl.js ${output}/
cp robots.txt ${output}/
cp fonts/* ${output}/fonts/

cp cache.manifest ${output}/
echo "# build $(date|md5)" >>${output}/cache.manifest

cp -a bootstrap ${output}/

cp dict/*.js ${output}/dict/

# when output changing file names here, update cache.manifest

# compile and optimize JS
java -jar compiler.jar \
    --js {entropy,passphrase,random,titles,dict,app}.js \
    --third_party \
    --compilation_level SIMPLE \
    --charset UTF8 \
    --create_source_map ${output}/main.js.map \
    > ${output}/main.js
java -jar compiler.jar \
    --js {random,plot}.js \
    --third_party \
    --compilation_level ADVANCED \
    --charset UTF8 \
    --create_source_map ${output}/plot.js.map \
    > ${output}/plot.js

# process other HTML/JS/CSS files
i="index.html"
awk -f script.awk ${i} | java -jar htmlcompressor-1.5.3.jar --compress-js --compress-css > ${output}/${i}
i="plot.html"
java -jar htmlcompressor-1.5.3.jar --compress-js --compress-css ${i}> $output/$i
i='styles.css'
java -jar htmlcompressor-1.5.3.jar --compress-css ${i} > ${output}/${i}

# generate favicon and Apple touch images
# if this is changed, need to update HTML too
# it's Inkscape weirdness that requires full path for i/o files
logo=$(mktemp /tmp/tmpXXXXX)
inkscape --without-gui --export-png=${logo} --export-width=512 --export-height=512 --file=$(pwd)/logo.svg
convert -geometry 64x64 ${logo} ${output}/favicon.ico
for s in 60 76 120 152; do
    geom="${s}x${s}"
    convert -comment Passphrase.Today -geometry ${geom} ${logo} ${output}/apple-touch-icon-${geom}.png
done

chmod -R a+r ${output}

# copy for Cordova
cp -a ${output}/* cordova/www/
convert -comment Passphrase.Today ${logo} cordova/www/icon.png
rm ${logo}

# if Android platform was not found, just add it
if [ ! -d cordova/platforms/android ]; then
    pushd cordova
    cordova platform add android
    popd
    # remove obsolete Internet permission
    tmp=$(mktemp /tmp/tmpXXXXX)
    # <uses-permission android:name="android.permission.INTERNET" />
    grep -v 'uses-permission' <cordova/platforms/android/AndroidManifest.xml >${tmp}
    mv ${tmp} cordova/platforms/android/AndroidManifest.xml
fi

# compress for Nginx gzip_static
find ${output}/ | egrep '\.(html|map|svg|eot|woff|woff2|ttf|css|js|manifest)$' | xargs gzip -9kf

if [ "$1" = "ssh" ]; then
    rsync --compress-level=9 --checksum -avz --delete output/ kautsky:passphrase/
fi