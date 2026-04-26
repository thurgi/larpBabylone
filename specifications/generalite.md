# Généralité

Cette application a pour but de fournir un environnement de travail collaboratif sur de la documentation.

Elle permet de :
* créer, lire, modifier et supprimer (CRUD) des documents.
* créer, lire, modifier, supprimer (CRUD) des versions du document dont elles sont enfant.
* créer, lire, modifier, supprimer (CRUD) des groupes

# Les documents et versions
Un document est composé d'un ensemble de versions.
Il doit y avoir une seule version valide par document.

Les versions disposent, dans l'IHM, d'une interface permettant d'éditer le texte de manière simplifiée.

il est possible d'associer des groupes a un document dans l'ihm.


# Utilisateurs
Les utilisateurs doivent pouvoir se connecter avec leurs comptes Discord ou Google.
Lorsqu'ils sont connectés, ils doivent pouvoir se déconnecter.

# Groupes
Une gestion des groupes doit exister et permettre de limiter les actions possibles sur les documents et dans l'ihm. cette ihm n'est disponible qu'a des utilisateurs aillant 

Le fonctionnement est le suivant :
* Un document peut posséder de 0 à n groupes.
* Un groupe peut posséder de 0 à n utilisateurs.
* Un groupe définit le droit de réaliser des actions (CRUD) sur les documents et les versions pour les utilisateurs du groupe. Il permet également de donner les droits de lecture publique, d'adminsitration et les droits des actions (crud) sur les groupes.
* Si aucun groupe n'est affecté au document alors tout le monde peut faire toutes les actions sur le document et les versions.
* Si un ou plusieurs groupes sont affectés à un document, l'action doit valider qu'au moins un des groupes de l'utilisateur lui donne le droit de réaliser cette action.

Un utilisateur dont le username est défini dans un fichier d'environnement doit pouvoir réaliser toutes les actions quelles qu'elles soient.

Une ihm doit permettre de gerer et d'afficher les groupes. Cette affichage est limité au superadmin ou a un utilisateur aillant au moins administrateur dans l'un de ces groupes.

Il est possible d'associer des utilisateurs a des groupes dans l'ihm



# Solution retenue

Cette application s'inscrit dans un Test Driven Design.
Cette application dispose d'une API au format OpenAPI dont le contrat est à la racine du projet (openapi.yml).

# Stockage des données (groupes, documents, versions)
Bien qu'il soit possible d'ajouter une base de données, il faut prouver l'intérêt de celle-ci par rapport au stockage de fichier plat.

## IHM
Pour simplifier l'édition de texte, la librairie @gravity-ui/markdown-editor sera utilisée (https://github.com/gravity-ui/markdown-editor).

## Développement
Tous les développements sont réalisés en environnement conteneurisé avec utilisation d'images publiques et montage des sources via des volumes. Ces containers utilisent l'utilisateur local avec récupération du GID et UID de l'utilisateur courant pour respecter les droits sur les fichiers entre environnement conteneurisé et environnement local.

Un fichier Makefile permet de lancer les commandes d'installation, de lancement et d'arrêt des services. Un fichier d'environnement associé permet de stocker les variables spécifiques si nécessaire.
