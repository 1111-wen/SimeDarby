with open("web/sw.js", "r", encoding="utf-8") as f:
    text = f.read()

text = text.replace("floodsafe-v5", "floodsafe-v6")
text = text.replace('"./js/rain.js"', '"./js/rain.js", "./js/sponge.js"')

with open("web/sw.js", "w", encoding="utf-8") as f:
    f.write(text)

print("Updated web/sw.js successfully.")
