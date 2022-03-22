# ft-cli


The fetch-template CLI provides an interface with [Fetch Template](https://www.fetch-template.com), a service for organizing and executing code patterns.

Installation: 
```sh
npm i -g fetch-template-cli
```

Login with email:
```sh
ft login --email <your@email.com> --password <yourpassword>
```

Login with GitHub Auth0:
```sh
ft github-login
```

## Example: list templates that match a search query
```sh
ft list <query>
```
<img width="684" alt="image" src="https://user-images.githubusercontent.com/26925206/159493027-612c6541-bfb7-42cd-8410-5feeb37dc8c5.png">

## Example: fetch and write a template by name
```sh
ft <template_name> [...args]
```
<img width="565" alt="image" src="https://user-images.githubusercontent.com/26925206/159492902-59a82b30-5524-4ddb-aa6b-8d2e8574d2ea.png">

## Example: fetch a template but only print its output to stdout
```sh
ft <template_name> _demo [...args]
```
<img width="791" alt="image" src="https://user-images.githubusercontent.com/26925206/159493344-d1067a42-1365-496c-ab3f-1c7fdbb7b3bf.png">

## Example: fetch and run a Flow
```sh
ft flow "<flow_name>"
```
<img width="620" alt="image" src="https://user-images.githubusercontent.com/26925206/159016380-d251e287-5716-4c6e-921b-202065132da9.png">
