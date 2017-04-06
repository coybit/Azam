# Clean List
sed -e "s/\[.*\]//g; s/([^()]*)//g; s/ /+/g" movies.txt > out.txt

# Fetch data about movies and save in out.json
#rm out.json

totalLines=$(grep -c '^' out.txt)
nLines=1

echo '[' >> out.json 

while read -r line
do
	echo '{"movie": "'$line'", "info": ' >> out.json
	curl "http://www.omdbapi.com/?t="$line >> out.json

	if [ $nLines -lt $totalLines ] 
	then
		echo '},' >>  out.json
	else
		echo '}' >>  out.json
	fi

	nLines=$(($nLines + 1))
	
done < out.txt

echo "]" >> out.json

