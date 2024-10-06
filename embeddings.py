import requests
import json

# Function to get embeddings from Jina API


def get_embeddings(input_text):
    url = 'https://api.jina.ai/v1/embeddings'
    headers = {
        'Content-Type': 'application/json',
        'Authorization': 'Bearer jina_ef6dafaed39140d3be326fed4563ad57NTMQISHiFL08PKTm22AxTF6smCZi'}
    data = {
        "model": "jina-embeddings-v3",
        "task": "retrieval.passage",
        "dimensions": 1024,
        "late_chunking": True,
        "embedding_type": "float",
        "input": input_text
    }

    response = requests.post(url, headers=headers, json=data)
    return response.json()

# Function to read input file and split into smaller chunks


def read_input_file(file_path, max_length=2048):
    with open(file_path, 'r', encoding='utf-8') as file:
        text = file.read()

    # Split the input into chunks, making sure they are not larger than max_length
    chunks = [text[i:i+max_length] for i in range(0, len(text), max_length)]
    return chunks

# Function to save embeddings to a file


def save_embeddings(output_file, embeddings):
    with open(output_file, 'w', encoding='utf-8') as file:
        json.dump(embeddings, file, ensure_ascii=False, indent=4)


# Example usage
input_file = '/home/cybernovas/Desktop/2024/gita-gpt/ask_krishna/data/English-Bhagavad-gita-His-Divine-Grace-AC-Bhaktivedanta-Swami-Prabhupada.txt'  # Path to input file
output_file = 'embeddings.json'  # Path to output file

# Read and chunk the input text from the file
input_text_chunks = read_input_file(input_file)

all_embeddings = []

# Process each chunk separately to get embeddings
for chunk in input_text_chunks:
    embeddings = get_embeddings([chunk])  # Wrap the chunk in a list
    all_embeddings.append(embeddings)

# Save all embeddings to a file
save_embeddings(output_file, all_embeddings)

print(f'Embeddings saved to {output_file}')
