sed -e "s/\[.*\]//g; s/([^()]*)//g; s/ /+/g" movies.txt > out.txt

echo '[' > out.json

while read -r line
do
	curl "http://www.omdbapi.com/?t="$p > out.json
	echo ',' >  out.json
done < out.txt

#while read p; do
#  curl "http://www.omdbapi.com/?t="$p > response
#  echo response,','
#done < <(out)

echo "]" > out.json

