export default function Portfolio() {
  const projects = [
    {
      id: 1,
      title: 'Machine Learning Image Classifier',
      description: 'A deep learning model that classifies images with 95% accuracy using TensorFlow and Keras. Trained on a dataset of over 10,000 images across 10 categories.',
      technologies: ['Python', 'TensorFlow', 'Keras', 'NumPy'],
      image: '/project1.jpg',
      link: '/projects/ml-image-classifier',
    },
    {
      id: 2,
      title: 'Data Visualization Dashboard',
      description: 'Interactive web dashboard for visualizing complex datasets. Features include real-time filtering, multiple chart types, and exportable reports.',
      technologies: ['React', 'D3.js', 'Node.js', 'Express'],
      image: '/project2.jpg',
      link: '/projects/data-viz-dashboard',
    },
    {
      id: 3,
      title: 'Predictive Analytics API',
      description: 'RESTful API that provides predictive analytics capabilities for financial data. Includes time series forecasting and anomaly detection.',
      technologies: ['Python', 'Flask', 'pandas', 'scikit-learn'],
      image: '/project3.jpg',
      link: '/projects/predictive-api',
    },
    {
      id: 4,
      title: 'Natural Language Processing Tool',
      description: 'A tool that analyzes sentiment and extracts entities from text data. Used by marketing teams to understand customer feedback.',
      technologies: ['Python', 'NLTK', 'spaCy', 'Transformers'],
      image: '/project4.jpg',
      link: '/projects/nlp-tool',
    },
  ];

  return (
    <div className="max-w-6xl mx-auto p-8">
      <h1 className="text-4xl font-bold mb-2 text-center">My Portfolio</h1>
      <p className="text-xl text-gray-600 mb-12 text-center">A collection of my work in data science and software development</p>
      
      <div className="grid grid-cols-1 md:grid-cols-2 gap-10">
        {projects.map((project) => (
          <div key={project.id} className="bg-white rounded-lg overflow-hidden shadow-lg hover:shadow-xl transition-shadow duration-300">
            <div className="h-48 bg-gray-200 flex items-center justify-center">
              <span className="text-gray-500 text-sm">[Project Image Placeholder]</span>
            </div>
            <div className="p-6">
              <h2 className="text-2xl font-bold mb-2">{project.title}</h2>
              <p className="text-gray-700 mb-4">{project.description}</p>
              
              <div className="mb-4">
                <h3 className="text-sm text-gray-500 mb-2">Technologies Used:</h3>
                <div className="flex flex-wrap gap-2">
                  {project.technologies.map((tech, index) => (
                    <span key={index} className="bg-blue-100 text-blue-800 text-xs px-2 py-1 rounded">
                      {tech}
                    </span>
                  ))}
                </div>
              </div>
              
              <a 
                href={project.link} 
                className="inline-block bg-blue-500 hover:bg-blue-600 text-white font-medium px-4 py-2 rounded transition-colors duration-300"
              >
                View Project Details
              </a>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}