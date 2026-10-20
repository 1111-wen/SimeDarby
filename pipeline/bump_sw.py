with open("web/sw.js", "r", encoding="utf-8") as f:
    text = f.read()

text = text.replace("floodsafe-v6", "floodsafe-v7")

with open("web/sw.js", "w", encoding="utf-8") as f:
    f.write(text)

print("Updated web/sw.js to floodsafe-v7")
