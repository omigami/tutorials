from omigami import Spec2Vec
from matchms.importing import load_from_mgf
import matchms
import requests

QUERY_MGF = "sample.mgf"

def load_query():
    specs = load_from_mgf(QUERY_MGF)
    spec = list(specs)[0]
    spec_id = spec.metadata['spectrumid']
    return spec_id

def get_spec2vec_similarities():
    client = Spec2Vec()

    n_best_matches = 5
    include_metadata = ["Compound_name"]
    ion_mode = "positive"  # either positive or negative
    result = client.match_spectra_from_path(
        QUERY_MGF, n_best_matches, include_metadata, ion_mode=ion_mode,
    )

    matches = result[0] # we only submit a single sample so there is only one result
    id_names = dict(matches.iloc[:, 1])
    matches = dict(matches.iloc[:, 0])  # get just the IDs and similarity scores
    matches = [(match, matches[match]) for match in matches]
    return matches, id_names

def build_nodes_and_links(graph):
    '''
    graph = {
       id1: [(id2, 0.5), (id3, 0.8)]
    }
    '''

    id_index = {}
    nns = []
    lls = set()
    curr_id = 0
    
    for node in graph:
        if node not in id_index:
            nns.append({"id": node})
            id_index[node] = curr_id
            curr_id += 1
        for link in graph[node]:
            l_id = link[0]
            if l_id not in id_index:
                id_index[l_id] = curr_id
                nns.append({"id": l_id})
                curr_id += 1

    for node in graph:
        for link in graph[node]:
            target_index = id_index[link[0]]
            source_index = id_index[node]
            if target_index == source_index:
                continue
            similarity = round(link[1], 3)

            # source is always smaller to prevent duplicates
            source_index, target_index = sorted([source_index, target_index])
            link_tuple = (source_index, target_index, similarity)
            lls.add(link_tuple)

    # {"similarity": "0.5", "source": 0, "target": 1}
    lls = [
        {"similarity": str(ll[2]), "source": ll[0], "target": ll[1]} for ll in lls
    ]
    return {"nns": nns, "lls": lls}

    # nns = [{"id": "a"}, {"id": "b"}, {"id": "c"}];
    # lls = [{"similarity": "0.5", "source": 0, "target": 1}, {"similarity": "0.2", "source": 0, "target": 2}]
    # data = {"nns": nns, "lls": lls}


def get_graph_data():
    graph = {}
    root = load_query()
    all_id_names = {}
    matches, id_names = get_spec2vec_similarities()
    
    all_id_names.update(id_names)
    graph[root] = matches

    for match in matches:
        new_root = match[0]
        mgf_files_url = f"https://files.omigami.com/gnps/{new_root}.mgf"

        r = requests.get(mgf_files_url)
        with open(QUERY_MGF, "w") as f:
            f.write(r.text)

        new_matches, id_names = get_spec2vec_similarities()
        all_id_names.update(id_names)
        graph[new_root] = new_matches

    data = build_nodes_and_links(graph)
    data['id_names'] = all_id_names
    return data
