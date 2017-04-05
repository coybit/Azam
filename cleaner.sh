# Clean List
sed -e "s/\[.*\]//g; s/([^()]*)//g; s/ /+/g" movies.txt > out.txt

# Fetch data about movies and save in out.json
rm out.json

echo '[' >> out.json 

while read -r line
do
	echo '{\"movie\": \"'$line'\", \"info\": '
	curl "http://www.omdbapi.com/?t="$line >> out.json
	echo ',' >>  out.json
	
done < out.txt

echo "]" >> out.json

